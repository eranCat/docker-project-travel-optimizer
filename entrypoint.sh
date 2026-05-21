#!/bin/sh
set -e
# Patch the API URL placeholder in the compiled JS bundle at runtime
REAL_URL="${VITE_API_BASE_URL:-http://localhost:8000}"
JS=$(find /app/frontend/dist/assets -name "*.js" | head -1)
[ -n "$JS" ] && sed -i "s|__VITE_API_BASE_URL__|${REAL_URL}|g" "$JS"
cd /app/backend
exec uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1
