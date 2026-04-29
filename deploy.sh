#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/root/projects/ilead"
PM2_NAME="ilead-api"
BACKEND_PORT="4016"

echo "==> iLead deploy started"

if [[ ! -d "$APP_DIR" ]]; then
  echo "ERROR: App directory not found: $APP_DIR"
  exit 1
fi

cd "$APP_DIR"

if [[ -d ".git" ]]; then
  echo "==> Pulling latest code"
  git pull --ff-only
else
  echo "==> Skipping git pull (.git not found)"
fi

echo "==> Installing dependencies"
npm install

echo "==> Generating Prisma client"
npm run prisma:generate

echo "==> Running database migrations"
npm run db:migrate

echo "==> Building backend + frontend"
npm run build

echo "==> Restarting backend with PM2"
if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2 restart "$PM2_NAME"
else
  pm2 start backend/src/server.js --name "$PM2_NAME"
fi

pm2 save

echo "==> Reloading Nginx"
if command -v systemctl >/dev/null 2>&1; then
  sudo systemctl reload nginx
else
  echo "WARNING: systemctl not found, skipped Nginx reload"
fi

echo "==> Health check"
curl -fsS "http://127.0.0.1:${BACKEND_PORT}/health" && echo

echo "==> Deploy complete"
