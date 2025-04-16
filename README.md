# 🧭 Travel Optimizer

Travel Optimizer is a Dockerized microservices-based backend that helps users find Points of Interest (POIs) based on their interests and location. It integrates real POI data from OpenStreetMap (Overpass API) and uses an LLM (via Ollama) to intelligently match user interests to POI categories.

## 🚀 Features

- 🔍 **Interest-based POI Matching** — Users can input free-form interests, and the backend finds suitable POIs in the chosen location.
- 🗺️ **Real Location-Based POIs** — Uses Overpass API to get accurate POIs from OpenStreetMap based on coordinates.
- 🧠 **LLM Integration** — Enhances POI category matching using a local LLM via [Ollama](https://ollama.ai/).
- ⚡ **FastAPI Microservice** — Clean REST API for all matching and user endpoints.
- 🐳 **Docker-Based Deployment** — Easily spin up services using Docker Compose.
- 🔐 **User Authentication** — Secure login, registration, and JWT-based token handling.
- 🧪 **Unit Test Coverage** — Includes test cases and structure for robust testing.

---

## 🧱 Architecture

```plaintext
.
├── backend/
│   ├── main.py
│   ├── routers/
│   ├── models/
│   ├── services/
│   ├── schemas/
│   └── tests/
├── docker-compose.yml
├── .env
└── README.md
```

---

## ⚙️ Technologies

- **Backend Framework**: FastAPI
- **Database**: PostgreSQL
- **LLM Integration**: Ollama (local LLM)
- **Geolocation/POI Source**: Overpass API (OpenStreetMap)
- **Authentication**: OAuth2 w/ JWT
- **Containerization**: Docker, Docker Compose
- **Testing**: `unittest` (TestCase classes)

---

## 🧪 Getting Started

### Prerequisites

- Docker
- Ollama installed locally with a supported model (e.g., `mistral`)
- Python 3.11+ (for running tests or development)

### Setup

1. **Clone the repo**

```bash
git clone https://github.com/EASS-HIT-PART-A-2025-CLASS-VII/docker-project-travel-optimizer.git
cd docker-project-travel-optimizer
```

2. **Create `.env`**

```env
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=your_db
DATABASE_URL=postgresql://your_user:your_password@db:5432/your_db
OLLAMA_HOST=http://host.docker.internal:11434
```

3. **Build and run containers**

```bash
docker-compose up --build
```

4. **Access FastAPI docs**

Open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser.

---

## 🧪 Running Tests

```bash
docker exec -it travel-backend bash
python -m unittest discover -s tests
```

---

## 📡 API Endpoints

| Method | Endpoint              | Description                     |
|--------|-----------------------|---------------------------------|
| POST   | `/auth/register`      | Register a new user             |
| POST   | `/auth/token`         | Login and get JWT token         |
| GET    | `/users/me`           | Get current logged-in user      |
| POST   | `/api/match-pois-llm` | Get POIs by location + interest |

---

## 📈 Future Improvements

- Add frontend map visualization (Leaflet.js or similar)
- Add route optimization (e.g., greedy TSP or ACO)
- Deploy with CI/CD on cloud
- Add Redis cache for Overpass queries