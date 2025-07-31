FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y curl
COPY backend/requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt
COPY backend/ /app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
