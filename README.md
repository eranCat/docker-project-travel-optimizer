# Travel Optimizer (monolith branch)

A fullstack app that generates optimized multi-stop travel itineraries using LLM-suggested OpenStreetMap tags and real-world routing from OpenRouteService.

This branch runs as a plain two-folder fullstack project — no Docker, no microservices. For the original Docker/microservices layout, check out `main`.

## Tech Stack

| Layer    | Technology                                  |
|----------|---------------------------------------------|
| Frontend | React, TypeScript, Vite, MUI, Leaflet       |
| Backend  | FastAPI (Python), SSE                       |
| LLM      | Groq (OpenAI-compatible) for OSM tag mapping |
| Maps     | Overpass API (POIs), OpenRouteService (routes), Nominatim (geocoding) |

## Architecture

```
┌─────────────┐         ┌──────────────────────────────────┐
│  React UI   │ ──HTTP─▶│  FastAPI backend                 │
│  (Vite)     │         │  ├─ /autocomplete (Nominatim)    │
└─────────────┘         │  ├─ /route-progress (SSE)        │
                        │  │   ├─ Groq → OSM tags          │
                        │  │   ├─ Overpass → POIs          │
                        │  │   └─ ORS → optimized routes   │
                        │  └─ /get-latest-routes/{id}      │
                        └──────────────────────────────────┘
```

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- A Groq API key (https://console.groq.com)
- An OpenRouteService API key (https://openrouteservice.org)

### Setup

```bash
git clone https://github.com/eranCat/docker-project-travel-optimizer.git
cd docker-project-travel-optimizer
git checkout monolith
```

#### Backend (terminal 1)

```bash
cd backend
cp .env.example .env   # fill in GROQ_API_KEY and ORS_API_KEY
python -m venv .venv
.venv\Scripts\activate     # PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend will be available at `http://localhost:8000` (`/health` returns `{"status":"ok"}`).

#### Frontend (terminal 2)

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`. The frontend reads `VITE_API_BASE_URL` from `frontend/.env` (defaults to `http://localhost:8000`).

### Environment Variables

`backend/.env`:
```env
GROQ_API_KEY=your_groq_key_here
ORS_API_KEY=your_openrouteservice_key_here
```

`frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:8000
```

## Project Structure

```
backend/
  main.py
  config.py
  requirements.txt
  models/                 # Pydantic models shared across modules
  routers/                # FastAPI routers (autocomplete, route-progress, health)
  services/
    maps/                 # Geocoding, Overpass POI fetch, ORS routing, client facade
    llm/                  # Groq client for OSM tag generation
    generate_optimized_routes.py
  utils/
  tests/
frontend/                 # React + Vite app
```

## Tests

```bash
cd backend
uvicorn main:app --port 8000     # in another terminal
pytest
```

## Author

**Eran Karaso** — [Portfolio](https://erancat.github.io/portfolio-site) · [GitHub](https://github.com/eranCat)
