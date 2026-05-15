# Travel Optimizer

Microservices travel planning application using Docker, LLM integration, and maps API for intelligent itinerary optimization.

## Features

- **Intelligent Itinerary Planning**: AI-powered recommendations using LLM
- **Route Optimization**: Calculate efficient travel routes using maps API
- **Microservices Architecture**: Scalable service-based design
- **Containerized Deployment**: Docker-based infrastructure
- **Multi-city Support**: Plan trips across multiple destinations
- **Budget Optimization**: Find cost-effective travel options
- **Real-time Updates**: Live traffic and travel time estimates

## Architecture

```
├── services/
│   ├── itinerary-service/    # Trip planning microservice
│   ├── maps-service/         # Maps and routing service
│   ├── ai-service/           # LLM-powered recommendations
│   └── booking-service/      # Travel booking integration
├── docker-compose.yml
└── nginx/                     # API Gateway
```

## Tech Stack

- **Microservices**: Node.js/TypeScript
- **Containerization**: Docker & Docker Compose
- **LLM Integration**: OpenAI/Claude APIs
- **Maps**: Google Maps API or similar
- **Database**: MongoDB or Firebase
- **Message Queue**: Redis (optional)

## Quick Start

```bash
# Build and run with Docker Compose
docker-compose up -d

# Service URLs
# - Itinerary: http://localhost:3001
# - Maps: http://localhost:3002
# - AI: http://localhost:3003
```

## API Endpoints

- `POST /api/itineraries` - Create new itinerary
- `GET /api/itineraries/:id` - Get itinerary details
- `POST /api/routes/optimize` - Optimize route
- `GET /api/recommendations` - Get AI recommendations

## Environment Variables

```
OPENAI_API_KEY=your_key
MAPS_API_KEY=your_key
MONGODB_URI=connection_string
```

## Deployment

```bash
# Build Docker images
docker build -t travel-optimizer:latest .

# Push to registry
docker push travel-optimizer:latest

# Deploy to cloud (k8s, ECS, etc.)
```

---

**Optimizing your travel experience with AI**