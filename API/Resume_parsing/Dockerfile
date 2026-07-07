FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --default-timeout=1000 --no-cache-dir -r requirements.txt
COPY . .
CMD sh -c "if grep -q FastAPI main.py; then uvicorn main:app --host 0.0.0.0 --port 8000; else python main.py; fi"
