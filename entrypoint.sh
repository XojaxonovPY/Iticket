#!/bin/sh
set -e

echo "==> Running database migrations..."
python manage.py migrate --noinput

echo "==> Starting Granian ASGI server on port ${PORT:-8000}..."
exec granian --interface asginl root.asgi:application --host 0.0.0.0 --port "${PORT:-8000}" --workers 1 --access-log
