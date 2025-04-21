FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY backend/requirements.txt /app/requirements.txt

# Install dependencies
RUN pip install --upgrade pip \
    && pip install -r requirements.txt \
    && pip install watchdog

# Copy the rest of the backend app
COPY backend/ /app

# Run the app and tests directly in CMD
CMD ["/bin/bash", "-c", "\
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload --log-level error & \
    server_pid=$!; \
    sleep 3; \
    python run_tests.py; \
    wait $server_pid"]
