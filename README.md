# Travel Optimizer

A fullstack app that generates optimized multi-stop travel itineraries using LLM-suggested OpenStreetMap tags and real-world routing from OpenRouteService.

> **Branch:** `monolith` — plain two-folder fullstack, no Docker. For the original Docker/microservices layout see `main`.

## Features

- **Intelligent POI discovery** — interests free-text → Groq LLM → OSM tags → Overpass API
- **Optimized routes** — greedy one-POI-per-category builder + 2-opt improvement, multiple route variants
- **Multi-day itineraries** — up to 5 days, day tabs in sidebar
- **POI quality filtering** — removes non-tourist venues (errands, infrastructure), permanently closed places, name-pattern blocklist (cemeteries, shelters)
- **Rich POI cards** — opening hours, wheelchair accessibility badge, category chips, direct Google/OSM search links
- **Route metadata** — walk/drive/cycle duration from ORS, vibe label per route
- **Export & share** — open route in Google Maps, copy shareable URL (form state encoded in query params)
- **Surprise Me** — randomize interests with one click
- **Time-of-day biasing** — morning/evening/night hints adjust which POI types Groq suggests
- **Wheelchair filter** — Overpass `wheelchair=yes/limited` query constraint
- **Dark mode** — MUI theme toggle
- **Per-IP rate limiting** — 5 route-generation requests/60 s

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | React 18, TypeScript, Vite, MUI, Leaflet (react-leaflet) |
| Backend  | FastAPI (Python), SSE streaming |
| LLM      | Groq (OpenAI-compatible) — converts free-text interests to OSM tags |
| Maps     | Overpass API (POIs), OpenRouteService (routing geometry + duration), Nominatim (geocoding) |

## Architecture

```
┌─────────────┐         ┌──────────────────────────────────────┐
│  React UI   │ ──HTTP─▶│  FastAPI backend                     │
│  (Vite)     │         │  ├─ GET /autocomplete (Nominatim)    │
└─────────────┘         │  ├─ GET /route-progress  (SSE)       │
                        │  │   ├─ Groq → OSM tags              │
                        │  │   ├─ Overpass → filter → POIs     │
                        │  │   └─ ORS → optimized routes       │
                        │  ├─ GET /get-latest-routes/{id}      │
                        │  └─ POST /frontend-log               │
                        └──────────────────────────────────────┘
```

SSE stream emits `stage` events (progress) then a `complete` event carrying a `route_id`. The frontend fetches the full result from `/get-latest-routes/{id}`.

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- [Groq API key](https://console.groq.com)
- [OpenRouteService API key](https://openrouteservice.org)

### Setup

```bash
git clone https://github.com/eranCat/docker-project-travel-optimizer.git
cd docker-project-travel-optimizer
git checkout monolith
```

#### Backend (terminal 1)

```bash
cd backend
cp .env.example .env        # fill in GROQ_API_KEY and ORS_API_KEY
python -m venv .venv
.venv\Scripts\Activate.ps1  # Windows PowerShell
# source .venv/bin/activate # macOS/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Health check: `GET http://localhost:8000/health` → `{"status":"ok"}`

#### Frontend (terminal 2)

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

### Environment Variables

`backend/.env`:
```env
GROQ_API_KEY=your_groq_key_here
ORS_API_KEY=your_openrouteservice_key_here
# Optional:
# OVERPASS_API_URL=https://overpass.kumi.systems/api/interpreter
```

`frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:8000
```

## Project Structure

```
backend/
  main.py                   # FastAPI app, middleware, logging
  config.py                 # pydantic-settings (reads .env)
  requirements.txt
  models/                   # Pydantic models
  routers/                  # route-progress SSE, autocomplete, health
  services/
    llm/                    # Groq client — interests → OSM tags
    maps/                   # Overpass POI fetch, ORS routing, geocoding
    generate_optimized_routes.py
  utils/
  tests/
frontend/
  src/
    components/             # React components
    hooks/                  # useRouteGenerator (all app state + SSE)
    models/                 # TypeScript interfaces
    services/               # API client (SSE + fetch)
    styles/                 # Category icons/colors
    utils/
```

## Tests

Integration tests require a running backend:

```bash
cd backend
uvicorn main:app --port 8000   # terminal 1
pytest                          # terminal 2
```

## Author

**Eran Karaso** — [Portfolio](https://erancat.github.io/portfolio-site) · [GitHub](https://github.com/eranCat)
