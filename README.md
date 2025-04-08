# ACO Pathfinder Backend with Database Integration

This project includes:
- **aco-api**: A FastAPI backend that computes optimal paths using an ACO-based algorithm and saves the results in a PostgreSQL database.
- **db**: PostgreSQL container, defined in the `docker-compose.yml`.

## Running the Project

1. Build and start the services:
   ```bash
   docker-compose up --build
