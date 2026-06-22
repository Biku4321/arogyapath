"""
Deterministic rules engine for symptom triage.

This module intentionally does NOT depend on the LLM. It scans reported
symptoms against a curated red-flag keyword list and a small set of
specialty-mapping rules. The goal is to guarantee that emergency detection
never relies solely on a probabilistic model -- the rules engine acts as a
safety floor that the AI layer cannot override.

In a real deployment, the red-flag list and specialty map would be reviewed
and signed off by a medical professional. For this hackathon prototype, the
lists below are illustrative and based on commonly cited emergency warning
signs (e.g. WHO / NHS patient-facing guidance).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class UrgencyTier(str, Enum):
    EMERGENCY = "EMERGENCY"
    SPECIALIST = "NEEDS_SPECIALIST"
    SELF_MANAGEABLE = "SELF_MANAGEABLE"
    UNCLEAR = "UNCLEAR"  # not enough information yet, ask follow-up questions


@dataclass
class TriageResult:
    tier: UrgencyTier
    matched_red_flags: list[str] = field(default_factory=list)
    suggested_specialty: str | None = None
    rationale: str = ""


# --- Red flag keywords -> if ANY match, escalate to EMERGENCY regardless of
# what else is in the message. Deliberately broad/aggressive recall: better
# a false alarm than a missed emergency. ---
RED_FLAG_KEYWORDS: dict[str, str] = {
    "chest pain": "Chest pain can indicate a cardiac emergency.",
    "crushing chest": "Crushing chest sensation is a classic heart attack warning sign.",
    "difficulty breathing": "Breathing difficulty can indicate a respiratory or cardiac emergency.",
    "can't breathe": "Inability to breathe normally is a medical emergency.",
    "shortness of breath": "Severe shortness of breath requires immediate attention.",
    "unconscious": "Loss of consciousness is always an emergency.",
    "unresponsive": "An unresponsive person requires emergency care immediately.",
    "seizure": "Seizures require urgent medical evaluation.",
    "convulsion": "Convulsions require urgent medical evaluation.",
    "severe bleeding": "Severe or uncontrolled bleeding is an emergency.",
    "heavy bleeding": "Heavy bleeding requires immediate care.",
    "stroke": "Stroke symptoms require emergency response (time-critical).",
    "face drooping": "Facial drooping is a key stroke warning sign (FAST protocol).",
    "slurred speech": "Sudden slurred speech can indicate stroke.",
    "suicidal": "Mentions of suicide require immediate, compassionate escalation.",
    "want to die": "Statements about wanting to die require immediate, compassionate escalation.",
    "severe allergic reaction": "Anaphylaxis is a life-threatening emergency.",
    "anaphylaxis": "Anaphylaxis is a life-threatening emergency.",
    "swelling of face": "Facial/throat swelling can indicate a severe allergic reaction.",
    "throat closing": "Throat swelling/closing is a life-threatening emergency.",
    "poisoning": "Suspected poisoning requires immediate emergency care.",
    "overdose": "Suspected overdose requires immediate emergency care.",
    "severe burn": "Severe burns require urgent specialist care.",
    "high fever in infant": "High fever in an infant requires urgent pediatric attention.",
    "blue lips": "Bluish lips/skin indicate oxygen deprivation -- an emergency.",
    "severe abdominal pain": "Severe, sudden abdominal pain can indicate a surgical emergency.",
    "coughing blood": "Coughing up blood requires urgent medical evaluation.",
    "vomiting blood": "Vomiting blood requires urgent medical evaluation.",
}

# --- Specialty mapping: keyword -> (specialty, example explanation) ---
SPECIALTY_MAP: list[tuple[str, str, str]] = [
    ("skin rash", "Dermatologist", "Skin-related symptoms are best evaluated by a dermatologist."),
    ("rash", "Dermatologist", "Skin-related symptoms are best evaluated by a dermatologist."),
    ("joint pain", "Orthopedist", "Joint and bone-related pain is typically evaluated by an orthopedist."),
    ("back pain", "Orthopedist", "Persistent back pain is often evaluated by an orthopedist or physiotherapist."),
    ("toothache", "Dentist", "Tooth and gum pain should be evaluated by a dentist."),
    ("tooth pain", "Dentist", "Tooth and gum pain should be evaluated by a dentist."),
    ("eye pain", "Ophthalmologist", "Eye-related symptoms should be evaluated by an eye specialist."),
    ("blurred vision", "Ophthalmologist", "Vision changes should be evaluated by an eye specialist."),
    ("ear pain", "ENT Specialist", "Ear, nose, and throat symptoms are evaluated by an ENT specialist."),
    ("sore throat", "ENT Specialist", "Persistent throat symptoms are evaluated by an ENT specialist."),
    ("pregnant", "Gynecologist", "Pregnancy-related concerns should be directed to a gynecologist."),
    ("missed period", "Gynecologist", "Menstrual or reproductive health concerns are evaluated by a gynecologist."),
    ("child fever", "Pediatrician", "Children's health concerns should be directed to a pediatrician."),
    ("baby", "Pediatrician", "Infant and child health concerns should be directed to a pediatrician."),
    ("anxiety", "Psychiatrist / Counselor", "Mental health concerns are best supported by a psychiatrist or counselor."),
    ("depress", "Psychiatrist / Counselor", "Mental health concerns are best supported by a psychiatrist or counselor."),
    ("diabetes", "Endocrinologist / General Physician", "Blood sugar related concerns are evaluated by a general physician or endocrinologist."),
    ("blood pressure", "General Physician / Cardiologist", "Blood pressure concerns are evaluated by a general physician, with cardiology referral if needed."),
    ("skin itch", "Dermatologist", "Persistent itching is best evaluated by a dermatologist."),
    ("urinat", "General Physician / Urologist", "Urinary symptoms are evaluated by a general physician or urologist."),
    ("stomach", "Gastroenterologist / General Physician", "Digestive symptoms are evaluated by a general physician, with GI referral if persistent."),
    ("diarrhea", "General Physician", "Diarrhea and digestive upset are typically evaluated by a general physician."),
    ("headache", "General Physician / Neurologist", "Recurring headaches are evaluated by a general physician, with neurology referral if severe or persistent."),
    ("cough", "General Physician / Pulmonologist", "Persistent cough is evaluated by a general physician."),
    ("fever", "General Physician", "Fever without other red-flag symptoms is typically evaluated by a general physician."),
]

DEFAULT_SPECIALTY = "General Physician"
MIN_SYMPTOM_DETAIL_LENGTH = 12  # characters; below this we ask a follow-up rather than guess


def evaluate_symptoms(symptom_text: str) -> TriageResult:
    """
    Run the deterministic rules engine over free-text symptom description.
    This always runs BEFORE the LLM is consulted, and its EMERGENCY verdict
    cannot be downgraded by the AI layer.
    """
    text = symptom_text.lower().strip()

    if len(text) < MIN_SYMPTOM_DETAIL_LENGTH:
        return TriageResult(
            tier=UrgencyTier.UNCLEAR,
            rationale="Not enough detail provided yet to assess urgency.",
        )

    matched_flags = [flag for flag in RED_FLAG_KEYWORDS if flag in text]
    if matched_flags:
        reasons = [RED_FLAG_KEYWORDS[f] for f in matched_flags]
        return TriageResult(
            tier=UrgencyTier.EMERGENCY,
            matched_red_flags=matched_flags,
            rationale=" ".join(reasons),
        )

    for keyword, specialty, explanation in SPECIALTY_MAP:
        if keyword in text:
            return TriageResult(
                tier=UrgencyTier.SPECIALIST,
                suggested_specialty=specialty,
                rationale=explanation,
            )

    # No red flags, no specific specialty match -> safe default
    return TriageResult(
        tier=UrgencyTier.SELF_MANAGEABLE,
        suggested_specialty=DEFAULT_SPECIALTY,
        rationale=(
            "No emergency warning signs or specific specialty indicators were detected. "
            "General self-care guidance applies, but please consult a general physician "
            "if symptoms persist or worsen."
        ),
    )
