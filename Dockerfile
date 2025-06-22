# Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Set environment variables for frontend build
ARG KINDE_CLIENT_ID
ARG KINDE_DOMAIN=https://ghhs.kinde.com
ENV VITE_KINDE_CLIENT_ID=$KINDE_CLIENT_ID
ENV VITE_KINDE_DOMAIN=$KINDE_DOMAIN

# Create .env file for Vite
RUN echo "VITE_KINDE_CLIENT_ID=$VITE_KINDE_CLIENT_ID" > .env && \
    echo "VITE_KINDE_DOMAIN=$VITE_KINDE_DOMAIN" >> .env

COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim-bullseye

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

WORKDIR /app

# Install system dependencies - minimal installation
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir gunicorn

# Copy backend code
COPY backend/ .

# Copy built frontend from the frontend-builder stage
COPY --from=frontend-builder /app/frontend/dist /app/static

# Expose the port
EXPOSE $PORT

# Create a startup script
RUN echo '#!/bin/bash\n\
gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --threads 2\n\
' > /app/start.sh \
    && chmod +x /app/start.sh

# Start the application
CMD ["/app/start.sh"] 