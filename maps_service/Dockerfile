FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
COPY maps_service/requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt
COPY maps_service/ /app
# models lives at the repo root; copy it as well so imports work
COPY models/ /app/models
ENV PYTHONPATH=/app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
