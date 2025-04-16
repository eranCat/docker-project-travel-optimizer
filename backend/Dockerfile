FROM python:3.12-slim

WORKDIR /app

COPY backend/ /app
COPY backend/requirements.txt /app

RUN pip install --upgrade pip \
    && pip install -r requirements.txt \
    && pip install watchdog

CMD ["/bin/bash", "-c", "uvicorn main:app --host 0.0.0.0 --port 8000 --reload --log-level error & sleep 2 && python run_tests.py && wait"]