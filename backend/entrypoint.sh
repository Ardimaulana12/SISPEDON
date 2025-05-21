#!/bin/bash

echo "⏳ Menunggu PostgreSQL siap..."
while ! nc -z postgres 5432; do
  sleep 1
done
echo "✅ PostgreSQL tersedia!"

echo "📦 Migrasi database..."
flask db upgrade

echo "🌱 Seeding data (jika belum ada)..."
python seed.py

echo "🚀 Menjalankan Gunicorn..."
exec gunicorn --workers=3 --bind=0.0.0.0:5000 main:app

