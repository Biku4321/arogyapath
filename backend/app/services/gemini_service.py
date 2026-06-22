"""
Gemini-backed conversational layer.

IMPORTANT SAFETY DESIGN NOTE:
This service is responsible for (a) holding a natural conversation with the
user to gather symptom detail, and (b) turning a rules-engine verdict into a
warm, plain-language explanation. It is NEVER asked to independently decide
emergency vs. non-emergency -- that classification always comes from
rules_engine.py. The LLM is only asked to explain/communicate, not to
override safety-critical decisions.
"""
from __future__ import annotations

import json
import logging

import google.generativeai as genai

from app.core.config import settings
from app.services.rules_engine import TriageResult, UrgencyTier

logger = logging.getLogger(__name__)

_model = None


def _get_model():
    global _model
    if _model is None:
        if not settings.gemini_api_key:
            raise RuntimeError(
                "GEMINI_API_KEY is not set. Add it to backend/.env (see .env.example)."
            )
        genai.configure(api_key=settings.gemini_api_key)
        _model = genai.GenerativeModel("gemini-2.5-flash")
    return _model


SYSTEM_PRIMER = """You are ArogyaPath's conversational health-navigation assistant.
Your ONLY job is to:
1. Ask short, clear follow-up questions to understand a user's symptoms (like a triage nurse would), OR
2. Explain a triage decision that has ALREADY been made by a separate safety system, in simple,
   warm, plain language suitable for someone with limited health literacy.

You must NEVER:
- Diagnose a specific disease or condition.
- Prescribe medication, dosages, or specific treatments.
- Contradict, soften, or override an EMERGENCY classification you are given.
- Claim certainty about what is medically wrong with the user.

Always keep responses short and scannable (roughly 3-6 sentences, can use a couple of short
bullet-style lines if helpful), warm, and easy to understand. If asked something
outside symptom navigation, gently redirect back to understanding their symptoms.
"""


def get_followup_question(conversation_history: list[dict], latest_symptom_text: str, language_code: str | None = None) -> str:
    """
    Ask Gemini for a short, relevant follow-up question to clarify symptoms,
    used when the rules engine returns UNCLEAR (not enough detail yet).
    """
    model = _get_model()
    history_text = "\n".join(
        f"{turn['role']}: {turn['content']}" for turn in conversation_history[-6:]
    )
    
    lang_instruction = f"Please provide your response in the language corresponding to the BCP-47 code: {language_code}." if language_code else ""
    
    prompt = (
        f"{SYSTEM_PRIMER}\n\n"
        f"Conversation so far:\n{history_text}\n\n"
        f"Latest message from user: \"{latest_symptom_text}\"\n\n"
        "The user's symptom description is too brief to assess. Ask ONE short, specific "
        "follow-up question to learn more (e.g. duration, severity, location of pain, "
        "associated symptoms). Return ONLY the question, nothing else.\n"
        f"{lang_instruction}"
    )
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logger.exception("Gemini follow-up question generation failed: %s: %s", type(e).__name__, e)
        return "Could you tell me a bit more -- how long have you had this, and how severe is it?"


def explain_triage_result(symptom_text: str, result: TriageResult, language_code: str | None = None) -> str:
    """
    Turn a rules-engine TriageResult into a warm, plain-language explanation.
    The tier itself is fixed input -- Gemini explains it, never changes it.
    """
    model = _get_model()

    tier_instruction = {
        UrgencyTier.EMERGENCY: (
            "This has been classified as an EMERGENCY. Clearly and calmly urge the user to seek "
            "immediate medical attention or call emergency services / go to the nearest hospital "
            "right away. Include one or two concrete 'while you wait for help' pointers relevant "
            "to their described symptom (e.g. sit upright if breathless, don't drive yourself if "
            "faint or in severe pain, avoid eating/drinking). Do not minimize the urgency. Keep it "
            "short, direct, and calm -- not alarming."
        ),
        UrgencyTier.SPECIALIST: (
            f"This has been classified as needing a {result.suggested_specialty}. "
            "Explain briefly why this type of specialist is appropriate, in simple terms. Then give "
            "2-3 concrete, practical pointers: what to track or note before the visit (duration, "
            "triggers, severity), one safe general-care tip relevant to the symptom if applicable, "
            "and a clear sign that means they should seek care sooner rather than waiting (e.g. "
            "sudden worsening, fever, severe pain). Do not just state the referral -- give the user "
            "something actionable to do right now."
        ),
        UrgencyTier.SELF_MANAGEABLE: (
            "This has been classified as likely self-manageable. Give 2-3 concrete, safe, general "
            "self-care tips relevant to the described symptom (rest, hydration, common safe home "
            "measures -- but never specific medication names or dosages). Clearly state a realistic "
            "timeframe to expect improvement, and a clear sign that means they should now see a "
            "general physician (symptom persists beyond a few days, worsens, or new symptoms like "
            "fever or severe pain appear)."
        ),
        UrgencyTier.UNCLEAR: (
            "Not enough information was provided. Gently ask for more detail."
        ),
    }[result.tier]

    lang_instruction = f"Please provide your explanation in the language corresponding to the BCP-47 code: {language_code}." if language_code else ""

    prompt = (
        f"{SYSTEM_PRIMER}\n\n"
        f"User's reported symptoms: \"{symptom_text}\"\n"
        f"Safety system classification (FIXED, do not change): {result.tier.value}\n"
        f"Rationale from safety system: {result.rationale}\n\n"
        f"Instruction: {tier_instruction}\n\n"
        "Write the explanation now, directly addressed to the user. Include the practical pointers "
        "requested above -- don't just state the classification and stop there.\n"
        f"{lang_instruction}"
    )

    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logger.exception("Gemini explanation generation failed: %s: %s", type(e).__name__, e)
        fallback = {
            UrgencyTier.EMERGENCY: (
                "This may be a medical emergency. Please seek immediate medical attention -- go to "
                "the nearest hospital or call your local emergency number right away. Do not drive "
                "yourself if you feel faint, severely short of breath, or in severe pain; ask someone "
                "to take you or call for an ambulance. While waiting for help, try to stay calm, sit "
                "or lie in a comfortable position, and avoid eating or drinking anything."
            ),
            UrgencyTier.SPECIALIST: (
                f"Based on what you've described, we recommend consulting a "
                f"{result.suggested_specialty}. {result.rationale} In the meantime: keep track of "
                "when the symptom started, what makes it better or worse, and any other symptoms "
                "you notice -- this will help the doctor a lot. Avoid self-medicating with leftover "
                "or borrowed prescription drugs. If the symptom suddenly worsens, becomes severe, "
                "or you develop fever, severe pain, or difficulty breathing, treat it as urgent and "
                "seek care sooner rather than waiting."
            ),
            UrgencyTier.SELF_MANAGEABLE: (
                "This appears to be manageable at home for now. General care: rest, stay hydrated, "
                "and monitor how you feel over the next 24-48 hours. Avoid taking new medication "
                "without guidance. Please consult a general physician if the symptom persists beyond "
                "2-3 days, gets worse instead of better, or if you develop new symptoms like fever, "
                "severe pain, or difficulty breathing -- those would mean it's no longer just "
                "self-manageable."
            ),
            UrgencyTier.UNCLEAR: "Could you share a bit more detail about your symptoms?",
        }
        return fallback[result.tier]