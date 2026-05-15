# Docker Travel Optimizer

A microservices-based travel planning application that leverages Docker containerization, LLM APIs, and maps integration to help users optimize their travel itineraries with intelligent recommendations.

## 🌍 Features

- **Smart Itinerary Optimization** - AI-powered suggestions using LLM APIs
- **Microservices Architecture** - Scalable, containerized services with Docker
- **Maps Integration** - Visual route planning and location-based features
- **Real-time Updates** - WebSocket support for live itinerary changes
- **Multi-language Support** - Content generation in multiple languages
- **Cost Optimization** - Calculate optimal routes considering time and budget
- **Weather Integration** - Real-time weather data for destinations
- **Personalized Recommendations** - ML-based suggestions based on user preferences

## 🛠 Tech Stack

- **Backend**: Node.js, TypeScript, Express
- **Frontend**: React, TypeScript, Tailwind CSS
- **Containerization**: Docker, Docker Compose
- **APIs**: OpenAI/LLM, Google Maps API, Weather API
- **Database**: MongoDB/PostgreSQL
- **Caching**: Redis
- **DevOps**: Docker, Docker Compose, GitHub Actions

## 📋 Project Architecture

```
docker-project-travel-optimizer/
├── services/
│   ├── api-gateway/          # API Gateway service
│   ├── itinerary-service/    # Itinerary management
│   ├── recommendation-service/ # LLM-based recommendations
│   ├── maps-service/         # Maps and routing service
│   ├── weather-service/      # Weather data provider
│   └── user-service/         # User management
├── frontend/                 # React client application
├── docker-compose.yml        # Multi-container setup
├── docker-compose.prod.yml   # Production configuration
└── scripts/                  # Build and deployment scripts
```

## 🚀 Getting Started

### Prerequisites

- Docker & Docker Compose 20.10+
- Node.js 16+ (for local development)
- API keys for:
  - OpenAI or compatible LLM API
  - Google Maps API
  - Weather API (OpenWeatherMap, etc.)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/eranCat/docker-project-travel-optimizer.git
cd docker-project-travel-optimizer
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your API credentials:
```env
OPENAI_API_KEY=sk-...
GOOGLE_MAPS_API_KEY=...
WEATHER_API_KEY=...
MONGODB_URI=mongodb://mongo:27017/travel_optimizer
REDIS_URL=redis://redis:6379
JWT_SECRET=your_secret_key
```

4. Start all services with Docker Compose:
```bash
docker-compose up -d
```

5. Access the application:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:5000
- **Admin Panel**: http://localhost:5000/admin

### Local Development (without Docker)

```bash
# Install dependencies for all services
npm install

# Start services with concurrently
npm run dev
```

## 📚 API Documentation

### Authentication
```bash
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh-token
```

### Itinerary Management
```bash
GET /api/itineraries                    # List user itineraries
POST /api/itineraries                   # Create new itinerary
GET /api/itineraries/:id                # Get itinerary details
PUT /api/itineraries/:id                # Update itinerary
DELETE /api/itineraries/:id             # Delete itinerary
POST /api/itineraries/:id/optimize      # Get AI recommendations
```

### Maps & Routes
```bash
POST /api/maps/directions               # Get route between locations
GET /api/maps/places/:id                # Get place details
GET /api/maps/nearby                    # Find nearby attractions
```

### Weather
```bash
GET /api/weather/:location              # Get weather forecast
GET /api/weather/historical/:location   # Get historical weather data
```

For detailed API documentation, see [API_DOCS.md](./API_DOCS.md)

## 🎯 Core Features

### Smart Optimization
- **Route Planning**: Calculates optimal routes considering distance, time, and user preferences
- **Cost Analysis**: Provides budget breakdowns and cost-saving recommendations
- **Time Management**: Suggests realistic time allocations for each activity

### LLM Integration
- **Natural Language Processing**: Understands travel preferences in plain English
- **Content Generation**: Creates detailed itinerary descriptions
- **Translation**: Supports content in multiple languages

### Maps Features
- **Visual Route Planning**: See your itinerary on an interactive map
- **Distance Calculation**: Automatic distance and estimated travel time
- **Location Search**: Find restaurants, hotels, attractions near your destinations

### User Experience
- **Progressive Web App**: Works offline with service workers
- **Real-time Notifications**: Get updates on itinerary changes
- **Collaborative Planning**: Share itineraries with friends

## 🐳 Docker Commands

### Build Services
```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build api-gateway
```

### Run Services
```bash
# Start all services in background
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f itinerary-service
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Remove volumes as well
docker-compose down -v
```

### Development with Hot Reload
```bash
# Start with file watching enabled
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## 📊 Performance Optimization

- **Caching**: Redis caching for frequently accessed data
- **Pagination**: Efficient data fetching with cursor-based pagination
- **Image Optimization**: WebP format with fallbacks
- **Load Balancing**: Nginx reverse proxy for load distribution
- **CDN Integration**: Cloud storage for assets

## 🔐 Security

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevent API abuse with rate limiting middleware
- **Input Validation**: Server-side validation of all inputs
- **CORS Configuration**: Restricted cross-origin requests
- **Environment Secrets**: Sensitive data in environment variables

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage
```

## 🚀 Deployment

### Deploy to Docker Hub
```bash
docker login
docker tag travel-optimizer:latest username/travel-optimizer:latest
docker push username/travel-optimizer:latest
```

### Deploy to Cloud (AWS ECS, Google Cloud Run, etc.)
See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 📈 Monitoring & Logging

- **Application Logs**: Aggregated with ELK Stack or similar
- **Performance Monitoring**: Datadog or New Relic integration
- **Error Tracking**: Sentry for error monitoring
- **Health Checks**: Docker health check endpoints

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.

## 👤 Author

**Eran Karaso** - Full-Stack Developer  
GitHub: [@eranCat](https://github.com/eranCat)

## 🔗 Resources

- [Docker Documentation](https://docs.docker.com)
- [Docker Compose](https://docs.docker.com/compose)
- [OpenAI API](https://openai.com/api)
- [Google Maps API](https://developers.google.com/maps)
- [Express.js](https://expressjs.com)
- [React Documentation](https://react.dev)

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000
# Kill the process
kill -9 <PID>
```

### Docker Compose Build Issues
```bash
# Clean build without cache
docker-compose build --no-cache
```

### Database Connection Issues
```bash
# Check MongoDB logs
docker-compose logs mongo

# Verify network
docker network ls
docker network inspect docker-project-travel-optimizer_default
```

For more help, open an issue on GitHub.