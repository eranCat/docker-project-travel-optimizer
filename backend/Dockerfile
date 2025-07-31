FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt
COPY backend/ /app
# Copy the shared models package
COPY models/ /app/models/
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
