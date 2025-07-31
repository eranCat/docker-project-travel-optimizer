FROM python:3.11-slim
WORKDIR /app
COPY llm_service/requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt
COPY llm_service/ /app
COPY models/ /app/models      # <- new line to include models
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
