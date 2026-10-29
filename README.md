# Multimodal Construction Intelligence Platform

React (Vite) frontend + FastAPI backend + multimodal LLM (Anthropic Claude by default).
Every AI response is validated against a strict Pydantic schema before it reaches the UI.

| Feature | Endpoint | Input |
|---|---|---|
| Site safety and PPE | `POST /api/safety/analyze` | multipart: `images[]`, `description`, `location` |
| Crack analysis | `POST /api/crack/analyze` | multipart: `images[]`, `description`, `element` |
| Property valuation | `POST /api/valuation/estimate` | JSON (`ValuationRequest`) |
| Project planning | `POST /api/planning/generate` | JSON (`PlanRequest`) |
| Daily advice + live weather | `POST /api/daily/advise` | JSON (`DailyRequest`) |
| Knowledge assistant | `POST /api/knowledge/ask` | JSON (`{question}`) |
| History | `GET /api/history[?feature=]`, `GET /api/history/{id}` | |
| Health | `GET /api/health` | |

Success: `{ "id": "...", "result": { ...schema... } }`. Error: `{ "error": "message" }` (always this shape).

## Setup

Requirements: Python 3.9+, Node.js 18+.

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                   # then add ANTHROPIC_API_KEY
uvicorn main:app --reload --port 8000

# Frontend (second terminal)
cd frontend
npm install
npm run dev                                            # http://localhost:5173
```

**No API key?** Leave `ANTHROPIC_API_KEY` empty (or set `MOCK_LLM=true`). The app runs in demo mode with
built-in sample answers, and the sidebar shows "Demo mode". Weather lookup still uses the live Open-Meteo API.

**Production build:** `cd frontend && npm run build` creates `dist/`. Serve it from any static host and set
`VITE_API_URL` at build time to the backend URL, and add that origin to `CORS_ORIGINS` in the backend `.env`.

## Architecture notes

- `backend/llm_client.py`: the only file that talks to the model. It sends images + text, demands JSON only, extracts
  and validates it against the feature's schema, and retries once with the validation error. To use Bedrock, Gemini or
  OpenAI, change `_call_model()` only.
- `backend/schemas.py`: the JSON contracts. `backend/prompts.py`: one system prompt per feature.
- `backend/services/images.py`: type, size, count and magic-byte checks on uploads.
- `backend/services/weather.py`: Open-Meteo lookup; returns `None` on failure so advice degrades gracefully.
- `backend/services/storage.py`: SQLite history in `backend/data/` (uploaded images saved to `data/uploads/`).
- Planning's `within_budget` flag is recomputed on the server rather than trusted from the model.
- User text is wrapped as data in prompts and the system prompt tells the model not to follow instructions inside it.

## Testing

```bash
cd backend && MOCK_LLM=true pytest -q      # functional + edge-case API tests
```

Manual end-to-end checklist (with a real key):
1. Safety: upload a site photo -> hazards table, PPE grid and actions render.
2. Crack: upload a wall-crack photo -> type, severity, causes, actions render.
3. Edge cases: upload a blurry/black/non-construction image -> yellow "Image could not be assessed" banner, no crash.
4. Upload a `.txt` renamed to `.png`, an empty file, a 6 MB file, 5 images -> clear error message each time.
5. Valuation/planning: submit with an empty location or negative area -> inline validation error.
6. Daily: use a misspelled city -> "Live weather unavailable" banner and cautious advice.
7. Stop the backend -> pages show "Cannot reach the server" and the sidebar shows "Backend offline".
8. Resize to phone width -> navigation becomes a horizontal scroller; tables scroll sideways.

## Known limitations

- AI output is advisory. Crack severity from a photo cannot confirm structural safety; always involve a licensed engineer.
- Valuation and cost figures come from the model's general knowledge, not live market data or local schedules of rates.
- Architectural visualisation is a written description, not a rendered drawing or 3D model.
- Image analysis quality depends on photo quality; crack width needs a scale object in frame.
- Weather uses today's forecast for the first geocoding match of the location name.
- No user accounts: history is shared by everyone using the same backend. Add authentication before public deployment.
- Response time is typically several seconds per AI call; there is no streaming.
