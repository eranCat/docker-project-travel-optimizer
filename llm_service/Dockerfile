FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y curl
COPY llm_service/requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt
COPY llm_service/ /app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
