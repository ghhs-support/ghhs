# Build frontend
FROM node:20-slim as frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Build backend
FROM python:3.12-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install -r requirements.txt

# Copy backend code
COPY backend/ .

# Copy frontend build files to Django's static directory
COPY --from=frontend-builder /frontend/dist/ /app/staticfiles/
COPY --from=frontend-builder /frontend/dist/assets/ /app/staticfiles/assets/

# Collect static files
RUN python manage.py collectstatic --noinput

# Runtime configuration
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV DJANGO_ENV=production

# Create a non-root user
RUN useradd -m appuser
RUN chown -R appuser:appuser /app
USER appuser

# Start command
CMD python manage.py migrate && gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT 