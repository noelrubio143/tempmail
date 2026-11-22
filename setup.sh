#!/usr/bin/env bash
set -e
[ -f .env ] || cp .env.example .env
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
if command -v ufw >/dev/null; then
  ufw allow 25/tcp || true
  ufw allow 9000/tcp || true
fi
if ss -tlnp | grep -q ':25 '; then
  echo "WARNING: may gumagamit na ng port 25 (hal. postfix). Ihinto muna: systemctl stop postfix"
fi
docker compose up -d
echo "Tapos na. Web UI: http://$(curl -s ifconfig.me):9000"
