#!/bin/bash
# iC-PM Deploy Script — icpm.sunico.de
# Voraussetzung: fittrack läuft bereits auf dem VPS
# Ausführen: bash /opt/icpm/deploy.sh
set -e

DOMAIN="icpm.sunico.de"
APP_DIR="/opt/icpm"
FITTRACK_DIR="/home/ubuntu/fittrack"
REPO="https://github.com/chrisjgs1982-lang/iC-PM.git"

echo "=== iC-PM Deploy: $DOMAIN ==="

# 1. Verzeichnis & Clone
sudo mkdir -p $APP_DIR && sudo chown ubuntu:ubuntu $APP_DIR
if [ -d "$APP_DIR/.git" ]; then
  echo "→ Git pull..."
  cd $APP_DIR && git pull origin main
else
  echo "→ Git clone..."
  git clone $REPO $APP_DIR && cd $APP_DIR
fi
cd $APP_DIR

# 2. .env anlegen
if [ ! -f "$APP_DIR/.env" ]; then
  cp .env.example .env
  PG_PASS=$(openssl rand -base64 24 | tr -d '=+/')
  JWT_SEC=$(openssl rand -base64 48 | tr -d '=+/')
  sed -i "s/CHANGE_ME_STRONG_PASSWORD/$PG_PASS/" .env
  sed -i "s/CHANGE_ME_RANDOM_256BIT_STRING/$JWT_SEC/" .env
  echo ""
  echo "⚠️  .env erstellt. Optional: OPENAI_API_KEY eintragen:"
  echo "   nano $APP_DIR/.env"
  echo ""
fi

# 3. iC-PM Container starten (joinen fittrack_default Netzwerk automatisch)
echo "→ Docker Compose build & start..."
sudo docker compose up -d --build
echo "→ Container gestartet ✓"

# 4. Let's Encrypt Zertifikat für icpm.sunico.de
# Nutzt fittrack's certbot-Volume (certbot_data = /var/www/certbot)
if ! sudo docker exec fittrack-nginx-1 ls /etc/letsencrypt/live/$DOMAIN/fullchain.pem &>/dev/null; then
  echo "→ Zertifikat für $DOMAIN anfordern..."
  sudo docker run --rm \
    -v fittrack_certbot_data:/var/www/certbot \
    -v fittrack_ssl_certs:/etc/letsencrypt \
    certbot/certbot certonly \
      --webroot \
      -w /var/www/certbot \
      -d $DOMAIN \
      --non-interactive \
      --agree-tos \
      --email admin@sunico.de \
      --no-eff-email
  echo "→ Zertifikat erhalten ✓"
else
  echo "→ Zertifikat bereits vorhanden ✓"
fi

# 5. fittrack nginx.conf um icpm.sunico.de ergänzen
NGINX_CONF="$FITTRACK_DIR/nginx/nginx.conf"
if ! grep -q "icpm.sunico.de" "$NGINX_CONF"; then
  echo "→ fittrack nginx.conf erweitern..."

  # Server-Block vor der letzten schließenden Klammer einfügen
  SNIPPET=$(cat $APP_DIR/nginx/fittrack-nginx-add-icpm.conf)
  # Füge den Block ein (vor dem letzten })
  python3 - <<PYEOF
content = open("$NGINX_CONF").read()
snippet = open("$APP_DIR/nginx/fittrack-nginx-add-icpm.conf").read()
# Entferne Kommentarzeilen aus dem Snippet
import re
block = re.sub(r'^\s*#.*\n', '', snippet, flags=re.MULTILINE).strip()
# Vor dem letzten } einfügen
idx = content.rfind('}')
new_content = content[:idx] + '\n' + block + '\n}\n'
open("$NGINX_CONF", 'w').write(new_content)
print("nginx.conf aktualisiert")
PYEOF

  echo "→ nginx.conf Syntax prüfen..."
  sudo docker exec fittrack-nginx-1 nginx -t
  echo "→ nginx reload..."
  sudo docker exec fittrack-nginx-1 nginx -s reload
  echo "→ fittrack nginx aktualisiert ✓"
else
  echo "→ icpm.sunico.de bereits in nginx.conf ✓"
  sudo docker exec fittrack-nginx-1 nginx -s reload
fi

# 6. Status
echo ""
echo "=== ✅ Deploy abgeschlossen ==="
sudo docker compose ps
echo ""
echo "→ App erreichbar unter: https://$DOMAIN"
echo ""
echo "Zertifikat-Erneuerung (einmalig einrichten):"
echo "  echo '0 3 * * * docker exec fittrack-certbot-1 certbot renew --quiet && docker exec fittrack-nginx-1 nginx -s reload' | sudo crontab -"
