FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --break-system-packages -r requirements.txt

# Copy application code
COPY ./app ./app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "localhost", "--port", "8000"]
