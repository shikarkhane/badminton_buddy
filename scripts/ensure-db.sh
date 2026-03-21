#!/usr/bin/env bash
# Ensure PostgreSQL is running and the database exists
set -e

if ! pg_isready -q 2>/dev/null; then
  echo "Starting PostgreSQL..."
  sudo service postgresql start
fi

# Create database and user if they don't exist (idempotent)
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'badminton_buddy'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE badminton_buddy;"
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname = 'bbuser'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER bbuser WITH PASSWORD 'bbpass';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE badminton_buddy TO bbuser;" 2>/dev/null
sudo -u postgres psql -d badminton_buddy -c "GRANT ALL ON SCHEMA public TO bbuser;" 2>/dev/null

echo "PostgreSQL is ready."
