#!/bin/bash
# iC-PM Deploy Script — icpm.sunico.de
# Ausführen auf dem VPS: bash deploy.sh
set -e

DOMAIN="icpm.sunico.de"
APP_DIR="/opt/icpm"
REPO="https://github.com/chrisjgs1982-lang/iC-PM.git"

echo "=== iC-PM Deploy: $DOMAIN ==="

# 1. Verzeichnis anlegen
sudo mkdir -p $APP_DIR
sudo chown ubuntu:ubuntu $APP_DIR

# 2. Repo clonen oder updaten
if [ -d "$APP_DIR/.git" ]; then
  echo "→ Git pull..."
  cd $APP_DIR && git pull origin main
else
  echo "→ Git clone..."
  git clone $REPO $APP_DIR
  cd $APP_DIR
fi

# 3. .env prüfen
if [ ! -f "$APP_DIR/.env" ]; then
  echo "→ Erstelle .env..."
  cp $APP_DIR/.env.example $APP_DIR/.env

  # Starke Passwörter generieren
  PG_PASS=$(openssl rand -base64 32 | tr -d '=+/' | head -c 32)
  JWT_SEC=$(openssl rand -base64 48 | tr -d '=+/')

  sed -i "s/CHANGE_ME_STRONG_PASSWORD/$PG_PASS/" $APP_DIR/.env
  sed -i "s/CHANGE_ME_RANDOM_256BIT_STRING/$JWT_SEC/" $APP_DIR/.env

  echo ""
  echo "⚠️  .env wurde erstellt. Bitte OPENAI_API_KEY eintragen (optional):"
  echo "   nano $APP_DIR/.env"
  echo ""
fi

# 4. Let's Encrypt Zertifikat holen (falls noch nicht vorhanden)
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  echo "→ Certbot: Zertifikat für $DOMAIN anfordern..."

  # Temporärer Webserver für ACME-Challenge
  docker run --rm -d --name certbot_tmp \
    -p 80:80 \
    -v /var/www/certbot:/var/www/certbot \
    nginx:alpine sh -c "mkdir -p /var/www/certbot && nginx -g 'daemon off;'" 2>/dev/null || true

  sudo certbot certonly --webroot \
    -w /var/www/certbot \
    -d $DOMAIN \
    --non-interactive \
    --agree-tos \
    --email admin@sunico.de \
    --no-eff-email

  docker stop certbot_tmp 2>/dev/null || true
  echo "→ Zertifikat erhalten ✓"
else
  echo "→ Zertifikat vorhanden ✓"
fi

# 5. Docker Compose starten (nur icpm Services, nicht mit bestehenden kollidieren)
cd $APP_DIR
echo "→ Docker Compose build & up..."
docker compose pull db 2>/dev/null || true
docker compose up -d --build

# 6. Health check
sleep 5
STATUS=$(docker compose ps --format json 2>/dev/null | grep -c '"running"' || docker compose ps | grep -c "Up" || echo "0")
echo ""
echo "=== Deploy abgeschlossen ==="
echo "→ Container Status:"
docker compose ps
echo ""
echo "→ iC-PM läuft auf: https://$DOMAIN"
echo ""
echo "Certbot auto-renew einrichten:"
echo "  echo '0 3 * * * certbot renew --quiet && docker exec icpm_nginx nginx -s reload' | sudo crontab -"
