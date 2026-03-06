FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

# Copy backend code
COPY . .

# Expose port
EXPOSE 8080

# Start command using shell form for variable expansion
CMD uvicorn server:app --host 0.0.0.0 --port ${PORT:-8080}
