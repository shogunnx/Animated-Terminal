# ---------- Frontend build ----------
FROM node:20-alpine AS fe
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* frontend/yarn.lock* ./
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; else npm ci; fi
COPY frontend/ ./
RUN if [ -f yarn.lock ]; then yarn build; else npm run build; fi

# ---------- Backend runtime ----------
FROM python:3.11-slim AS be
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

COPY backend/ /app/backend/
COPY --from=fe /app/frontend/dist /app/frontend_dist

COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 8001
CMD ["/app/start.sh"]
