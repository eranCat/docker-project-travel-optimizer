FROM python:3.11-slim
WORKDIR /app

# Install dependencies
COPY llm_service/requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt

# Copy service code
COPY llm_service/ /app

# Copy the shared models package
COPY models/ /app/models/

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
