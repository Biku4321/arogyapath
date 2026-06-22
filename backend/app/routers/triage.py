"""
Triage API router.

Flow for POST /api/triage/assess:
1. Run the deterministic rules engine on the latest symptom text.
2. If UNCLEAR -> ask Gemini for a short follow-up question, return tier=UNCLEAR.
3. Otherwise -> ask Gemini to explain the (already-decided) tier in plain language.
   The rules engine's tier is always returned as-is; Gemini only adds the
   human-friendly explanation text.
"""
from __future__ import annotations

from pydantic import BaseModel

from fastapi import APIRouter, HTTPException

from app.services import gemini_service
from app.services.rules_engine import UrgencyTier, evaluate_symptoms

router = APIRouter(prefix="/api/triage", tags=["triage"])


class ConversationTurn(BaseModel):
    role: str  
    content: str


class TriageRequest(BaseModel):
    symptom_text: str
    conversation_history: list[ConversationTurn] = []
    language_code: str | None = None  


class TriageResponse(BaseModel):
    tier: str
    matched_red_flags: list[str]
    suggested_specialty: str | None
    explanation: str
    is_followup_question: bool


@router.post("/assess", response_model=TriageResponse)
def assess_symptoms(payload: TriageRequest) -> TriageResponse:
    if not payload.symptom_text or not payload.symptom_text.strip():
        raise HTTPException(status_code=400, detail="symptom_text must not be empty")

    # Step 1: deterministic, safety-critical classification (no LLM involved)
    result = evaluate_symptoms(payload.symptom_text)

    history = [turn.model_dump() for turn in payload.conversation_history]

    # Step 2: UNCLEAR -> ask a clarifying question rather than guessing
    if result.tier == UrgencyTier.UNCLEAR:
        try:
            question = gemini_service.get_followup_question(
                history, payload.symptom_text, payload.language_code
            )
        except RuntimeError as e:
            raise HTTPException(status_code=500, detail=str(e)) from e
        return TriageResponse(
            tier=result.tier.value,
            matched_red_flags=[],
            suggested_specialty=None,
            explanation=question,
            is_followup_question=True,
        )

    # Step 3: classified -> Gemini explains the FIXED tier in plain language
    try:
        explanation = gemini_service.explain_triage_result(
            payload.symptom_text, result, payload.language_code
        )
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

    return TriageResponse(
        tier=result.tier.value,
        matched_red_flags=result.matched_red_flags,
        suggested_specialty=result.suggested_specialty,
        explanation=explanation,
        is_followup_question=False,
    )