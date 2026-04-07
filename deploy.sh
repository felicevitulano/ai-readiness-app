#!/bin/bash
set -e

# ============================================================
# AI Readiness App - Script di Deploy per VPS Ubuntu/Debian
# Esegui come root: bash deploy.sh
# ============================================================

APP_DIR="/opt/ai-readiness-app"
REPO_URL="https://github.com/felicevitulano/ai-readiness-app.git"
BRANCH="main"
APP_PORT=3000

echo "=========================================="
echo " AI Readiness App - Deploy VPS"
echo "=========================================="

# --- 1. Aggiorna il sistema e installa dipendenze base ---
echo ""
echo "[1/7] Aggiornamento sistema e dipendenze base..."
apt-get update -y
apt-get install -y curl git build-essential

# --- 2. Installa Node.js 20 LTS (se non presente) ---
echo ""
echo "[2/7] Verifica/installazione Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "  Node.js già installato: $NODE_VERSION"
else
    echo "  Installazione Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo "  Node.js installato: $(node -v)"
fi
echo "  npm: $(npm -v)"

# --- 3. Installa PM2 (process manager) ---
echo ""
echo "[3/7] Installazione PM2..."
npm install -g pm2 2>/dev/null || true
echo "  PM2: $(pm2 -v)"

# --- 4. Clona o aggiorna il repository ---
echo ""
echo "[4/7] Configurazione repository..."
if [ -d "$APP_DIR" ]; then
    echo "  Directory esistente, aggiornamento..."
    cd "$APP_DIR"
    git fetch origin "$BRANCH"
    git reset --hard "origin/$BRANCH"
else
    echo "  Clonazione repository..."
    git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# --- 5. Configura environment ---
echo ""
echo "[5/7] Configurazione environment..."
if [ ! -f "$APP_DIR/.env" ]; then
    cp "$APP_DIR/.env.example" "$APP_DIR/.env"
    echo ""
    echo "  ⚠️  File .env creato da .env.example"
    echo "  ⚠️  Modifica /opt/ai-readiness-app/.env per configurare:"
    echo "      - ANTHROPIC_API_KEY (per commenti AI)"
    echo ""
else
    echo "  File .env già presente, mantenuto"
fi

# --- 6. Installa dipendenze, genera Prisma client, migra DB, builda ---
echo ""
echo "[6/7] Build dell'applicazione..."
cd "$APP_DIR"
npm install --production=false
npx prisma generate
npx prisma migrate deploy
npm run build

# Seed del database (solo se il DB è vuoto)
echo "  Seed database (sezioni e domande)..."
npx tsx prisma/seed.ts 2>/dev/null || echo "  Seed già eseguito o errore non critico"

# --- 7. Avvia/riavvia con PM2 ---
echo ""
echo "[7/7] Avvio applicazione con PM2..."
pm2 delete ai-readiness 2>/dev/null || true
cd "$APP_DIR"
PORT=$APP_PORT pm2 start npm --name "ai-readiness" -- start
pm2 save
pm2 startup 2>/dev/null || true

echo ""
echo "=========================================="
echo " ✅ Deploy completato!"
echo "=========================================="
echo ""
echo " L'app è raggiungibile su:"
echo "   http://$(hostname -I | awk '{print $1}'):${APP_PORT}"
echo ""
echo " Comandi utili:"
echo "   pm2 status          - stato dell'app"
echo "   pm2 logs ai-readiness  - log in tempo reale"
echo "   pm2 restart ai-readiness - riavvio"
echo ""
echo " Per aggiornare in futuro:"
echo "   cd /opt/ai-readiness-app && bash deploy.sh"
echo ""
