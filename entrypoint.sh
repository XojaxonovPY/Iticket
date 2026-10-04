#!/bin/sh
set -e

echo "==> Running database migrations..."
python manage.py migrate --noinput

echo "==> Checking initial fixture data..."
python -c "
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'root.settings')
django.setup()
from apps.models import Category
from django.core.management import call_command

force = os.getenv('LOAD_FIXTURES', '').lower() in ('1', 'true', 'yes')
if force or not Category.objects.exists():
    print('==> Database is empty. Loading fixtures (categories, countries, places, events, tickets...)...')
    call_command('loaddata', 'category', 'country', 'place', 'sales_outlets', 'question', 'event', 'ticket')
    print('==> Fixtures loaded successfully!')
else:
    print('==> Initial data already exists in database, skipping fixtures.')
"

echo "==> Starting Granian ASGI server on port ${PORT:-8000}..."
exec granian --interface asginl root.asgi:application --host 0.0.0.0 --port "${PORT:-8000}" --workers 1 --access-log
