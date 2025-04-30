FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install Python dependencies first to leverage Docker caching
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Now copy the actual app code
COPY backend/ .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
