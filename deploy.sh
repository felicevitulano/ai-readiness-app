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

# --- 0. Controllo root ---
if [ "$EUID" -ne 0 ]; then
    echo "ERRORE: questo script deve essere eseguito come root (usa sudo)"
    exit 1
fi

# --- 1. Aggiorna il sistema e installa dipendenze base ---
echo ""
echo "[1/8] Aggiornamento sistema e dipendenze base..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl git build-essential ca-certificates

# --- 2. Installa Node.js 20 LTS (se non presente o versione vecchia) ---
echo ""
echo "[2/8] Verifica/installazione Node.js..."
NEED_NODE=1
if command -v node &> /dev/null; then
    NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')
    if [ "$NODE_MAJOR" -ge 20 ]; then
        echo "  Node.js già installato: $(node -v)"
        NEED_NODE=0
    else
        echo "  Node.js troppo vecchio ($(node -v)), aggiornamento a 20 LTS..."
    fi
fi
if [ "$NEED_NODE" -eq 1 ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo "  Node.js installato: $(node -v)"
fi
echo "  npm: $(npm -v)"

# --- 3. Installa PM2 ---
echo ""
echo "[3/8] Installazione PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi
echo "  PM2: $(pm2 -v)"

# --- 4. Clona o aggiorna il repository ---
echo ""
echo "[4/8] Configurazione repository..."
if [ -d "$APP_DIR/.git" ]; then
    echo "  Directory esistente, aggiornamento..."
    cd "$APP_DIR"
    git fetch origin "$BRANCH"
    git reset --hard "origin/$BRANCH"
else
    if [ -d "$APP_DIR" ]; then
        echo "  Directory esiste ma non è un repo git, rimozione..."
        rm -rf "$APP_DIR"
    fi
    echo "  Clonazione repository..."
    git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# --- 5. Configura environment ---
echo ""
echo "[5/8] Configurazione environment..."
if [ ! -f "$APP_DIR/.env" ]; then
    cp "$APP_DIR/.env.example" "$APP_DIR/.env"
    echo "  ⚠️  File .env creato da .env.example"
    echo "  ⚠️  Per i commenti AI, modifica /opt/ai-readiness-app/.env"
    echo "      e imposta ANTHROPIC_API_KEY, poi: pm2 restart ai-readiness"
else
    echo "  File .env già presente, mantenuto"
fi

# Esporta DATABASE_URL per Prisma in questa shell
export $(grep -v '^#' "$APP_DIR/.env" | grep DATABASE_URL | xargs)

# --- 6. Build dell'applicazione ---
echo ""
echo "[6/8] Build dell'applicazione..."
cd "$APP_DIR"
npm install --no-audit --no-fund
npx prisma generate
npx prisma migrate deploy

echo "  Seed database (sezioni e domande)..."
set +e
npx tsx prisma/seed.ts
SEED_EXIT=$?
set -e
if [ $SEED_EXIT -ne 0 ]; then
    echo "  Seed fallito o già eseguito (non critico)"
fi

echo "  Build Next.js..."
npm run build

# --- 7. Configura firewall (UFW se attivo) ---
echo ""
echo "[7/8] Configurazione firewall..."
if command -v ufw &> /dev/null; then
    if ufw status | grep -q "Status: active"; then
        echo "  UFW attivo, apertura porta $APP_PORT..."
        ufw allow $APP_PORT/tcp
        ufw allow ssh
    else
        echo "  UFW presente ma non attivo, salto"
    fi
else
    echo "  UFW non installato, salto"
fi

# --- 8. Avvia/riavvia con PM2 ---
echo ""
echo "[8/8] Avvio applicazione con PM2..."
cd "$APP_DIR"
pm2 delete ai-readiness 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

# Configura PM2 per avvio automatico al boot
PM2_STARTUP_CMD=$(pm2 startup systemd -u root --hp /root | grep "sudo" | tail -1)
if [ -n "$PM2_STARTUP_CMD" ]; then
    echo "  Configurazione avvio automatico..."
    eval "$PM2_STARTUP_CMD" || echo "  (auto-startup non configurato, l'app va riavviata manualmente al reboot)"
fi

# --- Verifica finale ---
echo ""
echo "Verifica avvio app (attendo 5 secondi)..."
sleep 5
pm2 status

VPS_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "=========================================="
echo " Deploy completato"
echo "=========================================="
echo ""
echo " App raggiungibile su:"
echo "   http://${VPS_IP}:${APP_PORT}"
echo ""
echo " Comandi utili:"
echo "   pm2 status                - stato dell'app"
echo "   pm2 logs ai-readiness     - log in tempo reale"
echo "   pm2 logs ai-readiness --err  - solo errori"
echo "   pm2 restart ai-readiness  - riavvio"
echo ""
echo " Per aggiornare in futuro:"
echo "   cd /opt/ai-readiness-app && bash deploy.sh"
echo ""
echo " Se l'app NON risponde su http://${VPS_IP}:${APP_PORT}:"
echo "   1. Verifica i log: pm2 logs ai-readiness --lines 50"
echo "   2. Esegui diagnostica: bash /opt/ai-readiness-app/diagnose.sh"
echo ""
