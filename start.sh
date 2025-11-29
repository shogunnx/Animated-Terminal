#!/usr/bin/env bash
set -e

export PORT="${PORT:-8001}"
echo "[START] Using PORT=$PORT"

# Run FastAPI (serves both API and frontend)
# Using /root/.venv/bin/uvicorn if available, else uvicorn
if [ -f "/root/.venv/bin/uvicorn" ]; then
    exec /root/.venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port "$PORT" --workers 1 --proxy-headers --forwarded-allow-ips="*"
else
    exec uvicorn backend.main:app --host 0.0.0.0 --port "$PORT" --workers 1 --proxy-headers --forwarded-allow-ips="*"
fi
