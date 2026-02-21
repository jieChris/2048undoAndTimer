#!/usr/bin/env bash
set -euo pipefail

# One-click deploy for frontend-only static site.
# Usage:
#   APP_DIR=/www/wwwroot/www.taihe.fun ./deploy_frontend.sh
#   ./deploy_frontend.sh main

APP_DIR="${APP_DIR:-/www/wwwroot/www.taihe.fun}"
BRANCH="${1:-main}"
PRUNE_BACKEND="${PRUNE_BACKEND:-1}"

if ! command -v git >/dev/null 2>&1; then
  echo "[ERROR] git is not installed."
  exit 1
fi

if [ ! -d "$APP_DIR/.git" ]; then
  echo "[ERROR] $APP_DIR is not a git repository."
  exit 1
fi

if [ "$APP_DIR" = "/" ]; then
  echo "[ERROR] APP_DIR cannot be /"
  exit 1
fi

echo "[1/4] Enter project directory: $APP_DIR"
cd "$APP_DIR"

echo "[2/4] Pull latest code from origin/$BRANCH"
git fetch origin "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "[3/4] Cleanup frontend-only files"
if [ "$PRUNE_BACKEND" = "1" ] && [ -d "backend" ]; then
  rm -rf backend
  echo "[INFO] Removed backend/ from web root."
fi

echo "[4/4] Reload Nginx"
if command -v nginx >/dev/null 2>&1; then
  nginx -s reload
else
  echo "[WARN] nginx command not found, skip reload."
fi

echo "[DONE] Frontend deploy finished."
