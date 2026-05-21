FROM python:3.12-slim

# Set working directory
WORKDIR /app

RUN apt-get update && apt-get install -y curl

# Install Python dependencies first to leverage Docker caching
COPY backend/requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
