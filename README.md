# ArogyaPath

AI-powered, multilingual health navigation assistant for rural and semi-urban India.
ArogyaPath does **not** diagnose illness -- it helps users understand the urgency of their
symptoms and directs them to the right type of care (emergency, specialist, or self-care),
with the nearest appropriate facility shown on a map.

## How it's structured

```
arogyapath/
├── backend/    FastAPI app: deterministic rules engine + Gemini explanation layer + facility lookup
└── frontend/   React app: chat UI, voice input/output, facility map
```

### Why a rules engine *and* an LLM?

Safety-critical classification (is this an emergency?) is decided by a deterministic,
auditable rules engine (`backend/app/services/rules_engine.py`) that scans for red-flag
symptoms. Gemini is only used to (a) ask clarifying follow-up questions and (b) explain
the rules engine's verdict in warm, plain language. **Gemini never decides or overrides
the urgency tier** -- this is a deliberate safety design choice, and a strong talking
point in a hackathon pitch.

## Running the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and add your GEMINI_API_KEY (get one at https://aistudio.google.com/apikey)

uvicorn app.main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs` once running.

## Running the frontend

```bash
cd frontend
npm install
npm run dev
```

App available at `http://localhost:5173`. The frontend expects the backend at
`http://localhost:8000` by default (override with a `VITE_API_BASE_URL` env var in a
`.env` file inside `frontend/` if needed).

## Demo flow

1. Open the app -- browser will ask for location permission (falls back to a sample
   Silchar, Assam location if denied/unavailable).
2. Type or speak a symptom, e.g. *"I have had a skin rash and itching for 3 days"*.
3. ArogyaPath classifies urgency (Emergency / Needs Specialist / Self-Manageable / needs
   more info) and explains why in plain language -- and reads it aloud.
4. If a specialist is recommended, nearby matching facilities appear on the map and as a
   list, sorted by distance.
5. Try a red-flag input like *"I have chest pain and difficulty breathing"* to see the
   Emergency tier trigger immediately, regardless of AI involvement.

## What's mocked vs real (be transparent about this when presenting)

| Component | Status |
|---|---|
| Rules engine (red-flag detection, specialty mapping) | Real logic, illustrative keyword list (would need clinical sign-off for production) |
| Gemini conversational layer | Real API calls |
| Facility data | Mock JSON dataset (`backend/app/data/facilities.json`) -- swap for Open Government Data / state health directory API in production |
| Voice input/output | Real, via browser-native Web Speech API (best support in Chrome/Edge) |
| Multilingual support | Functional for STT/TTS language selection; Gemini prompts are currently English-only -- next step is localizing prompts/responses |
| SMS/IVR fallback | Not implemented in this prototype -- documented as a roadmap item |

## Next steps (roadmap continuation)

- Localize Gemini prompts/responses per selected language
- Replace mock facility dataset with real Open Government Data Platform / state health API
- Add SMS/IVR fallback channel (Twilio) for non-smartphone users
- Clinical review and expansion of the red-flag keyword list and specialty mapping
- Pilot integration discussion with a local PHC or NGO
