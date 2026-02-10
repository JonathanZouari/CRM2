FROM python:3.12-slim AS builder

WORKDIR /build

RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc g++ && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.12-slim

RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

COPY --from=builder /install /usr/local

COPY app.py gunicorn.conf.py Procfile ./
COPY backend/ backend/

RUN chown -R appuser:appuser /app

USER appuser

ENV PORT=5000
EXPOSE 5000

CMD ["gunicorn", "app:app", "-c", "gunicorn.conf.py"]
