🗺️ Travel Optimizer – Microservices Architecture

Overview
--------

Travel Optimizer is a modular, containerized web application that uses AI to generate personalized travel itineraries based on user interests. It features a FastAPI backend, an AI microservice powered by Ollama, and a modern frontend built with Next.js. The system fetches Points of Interest (POIs), calculates routes, and displays everything on an interactive map.

Recent Enhancements
-------------------

✨ **Frontend**
- 🚀 `Vite` framework
- 📌 `App.tsx` with clickable POI links to Google Maps.
- 🗺️ `MapViewer` to support category-based icons and better route display (font-awesome).

🔧 **Backend Logic**
- 🧠 Optimized AI microservice communication for POI generation using Ollama.
- 🧭 Route planning with real POI locations and GeoJSON output.

System Architecture
-------------------

The app is structured in microservices, each serving a distinct purpose:

- 🧑‍💻 **Frontend (Next.js)** – User interface for travel input and route visualization.
- 🧠 **AI Microservice (Ollama)** – Processes interests into relevant POI categories.
- 🛰️ **Backend (FastAPI + Pydantic)** – Orchestrates POI matching, routing.

-------------------
📊 System Diagram:
------------------
<img src="docs/architecture.png" alt="Architecture" width="80%" style="border:1px solid #ccc;"/>

Run Locally
-----------

🚀 Prerequisites:
- Docker & Docker Compose installed
- Optional: Node.js + pnpm if editing frontend separately

📦 Clone the project:

```terminal
git clone https://github.com/EASS-HIT-PART-A-2025-CLASS-VII/docker-project-travel-optimizer.git
cd docker-project-travel-optimizer

```
🐳 Start with Docker:
```terminal
docker-compose up --build
```

🌍 Access the app at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs

💡 To rebuild the containers after changes:

```terminal
docker-compose down 
docker-compose up --build
```