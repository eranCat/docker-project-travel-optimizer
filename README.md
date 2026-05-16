# 🗺️ Travel Optimizer

A full-stack microservices app that generates optimized multi-stop travel itineraries using LLM reasoning and real-time maps data.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Vite |
| Backend | FastAPI (Python) |
| AI | LLM integration (OpenAI-compatible) |
| Maps | Google Maps API |
| Infra | Docker, Docker Compose |

## Features

- **Smart itinerary generation** — describe your trip in natural language, get a structured day-by-day plan
- **Route optimization** — minimizes travel time between stops using Maps API distance matrix
- **Microservices architecture** — frontend, backend, and AI services run as independent Docker containers
- **Interactive map view** — visualize your full itinerary on a map with waypoints
- **Editable plans** — adjust, reorder, or regenerate any part of the itinerary

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   React UI  │────▶│  FastAPI    │────▶│  LLM Service │
│  (Vite)     │     │  Backend    │     │  (OpenAI)    │
└─────────────┘     └──────┬──────┘     └──────────────┘
                           │
                    ┌──────▼──────┐
                    │  Google     │
                    │  Maps API   │
                    └─────────────┘
```

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Google Maps API key
- OpenAI API key (or compatible endpoint)

### Setup

```bash
git clone https://github.com/eranCat/docker-project-travel-optimizer.git
cd docker-project-travel-optimizer
cp .env.example .env
# Fill in your API keys in .env
docker compose up --build
```

App runs at `http://localhost:5173`

### Environment Variables

```env
OPENAI_API_KEY=your_key_here
GOOGLE_MAPS_API_KEY=your_key_here
```

## Project Structure

```
├── frontend/          # React + TypeScript UI
├── backend/           # FastAPI Python service
├── docker-compose.yml # Multi-container orchestration
└── .env.example       # Environment template
```

## Author

**Eran Karaso** — [Portfolio](https://erancat.github.io/portfolio-site) · [GitHub](https://github.com/eranCat)
