# ACO Pathfinder Backend with Docker Compose

This project contains:
- `aco-api`: A FastAPI backend using Ant Colony Optimization
- `frontend`: Placeholder for future frontend (Node.js)

## Run the whole system:
```bash
docker-compose up --build
```

### Backend Endpoint

POST `/find-path/`

Request:
```json
{
  "nodes": ["A", "B"],
  "edges": [{"from_node": "A", "to_node": "B", "distance": 10}],
  "start": "A",
  "end": "B"
}
```

Response:
```json
{
  "optimal_path": ["A", "B"],
  "total_distance": 42.0
}
```