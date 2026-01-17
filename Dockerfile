FROM node:18-alpine as frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Production Stage with Flask
FROM python:3.11-slim
WORKDIR /app

# Copy backend requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Copy built frontend assets
# We assume Flask will serve static files from a 'static' and 'templates' folder,
# OR we configure Flask to serve from 'dist'.
# Common pattern: Copy dist to root and tell Flask to serve it.
COPY --from=frontend-build /app/dist ./static
# Create a simple entry point helper if needed, or just let app.py serve /.
# Note: app.py needs to be modified to serve static files if we want Unified Deployment.
# For now, this Dockerfile prepares the assets.

ENV FLASK_ENV=production
EXPOSE 5000

# We need to ensure app.py serves the frontend for root routes.
# Command to run the app
CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]
