# ACO Pathfinder Backend with Database Integration

This project includes:
- **aco-api**: A FastAPI backend that computes optimal paths using an ACO-based algorithm and saves the results in a PostgreSQL database.
- **db**: PostgreSQL container, defined in the `docker-compose.yml`.

## Running the Project

1. Build and start the services:
   ```bash
   docker-compose up --build
   ```

2. Access the API documentation at:
   ```
   http://localhost:8000/docs
   ```

## Running the Tests

1. Ensure the services are running:
   ```bash
   docker-compose up --build
   ```

2. Run the tests using the following command:
   ```bash
   docker-compose exec aco-api pytest -v app/unit_tests.py
   ```
