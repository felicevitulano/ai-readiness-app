#!/bin/bash
# ============================================================
# AI Readiness App - Script di Diagnostica VPS
# Esegui come root: bash diagnose.sh
# ============================================================

APP_DIR="/opt/ai-readiness-app"
APP_PORT=3000

echo "=========================================="
echo " DIAGNOSTICA AI Readiness App"
echo "=========================================="

echo ""
echo "--- [1] Sistema ---"
echo "OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2)"
echo "Kernel: $(uname -r)"
echo "IP pubblico locale: $(hostname -I | awk '{print $1}')"

echo ""
echo "--- [2] Node.js & npm ---"
node -v 2>/dev/null && npm -v 2>/dev/null || echo "Node.js NON installato!"

echo ""
echo "--- [3] PM2 ---"
if command -v pm2 &> /dev/null; then
    pm2 -v
    echo ""
    pm2 status
else
    echo "PM2 NON installato!"
fi

echo ""
echo "--- [4] Repo e file ---"
if [ -d "$APP_DIR" ]; then
    echo "Directory $APP_DIR esiste"
    ls -la "$APP_DIR" | head -20
    echo ""
    if [ -f "$APP_DIR/.env" ]; then
        echo ".env presente:"
        grep -v '^#' "$APP_DIR/.env" | grep -v '^$' | sed 's/\(KEY=\).*/\1***hidden***/'
    else
        echo "❌ .env MANCANTE"
    fi
    echo ""
    if [ -d "$APP_DIR/.next" ]; then
        echo "✓ Build .next presente"
    else
        echo "❌ Build .next MANCANTE - esegui: cd $APP_DIR && npm run build"
    fi
    echo ""
    DB_FILE="$APP_DIR/prisma/data.db"
    if [ -f "$DB_FILE" ]; then
        echo "✓ Database SQLite presente: $(ls -lh $DB_FILE | awk '{print $5}')"
    else
        echo "❌ Database SQLite MANCANTE - esegui: cd $APP_DIR && npx prisma migrate deploy"
    fi
else
    echo "❌ Directory $APP_DIR NON esiste!"
fi

echo ""
echo "--- [5] Porta $APP_PORT ---"
if command -v ss &> /dev/null; then
    PORT_INFO=$(ss -tlnp | grep ":$APP_PORT ")
    if [ -n "$PORT_INFO" ]; then
        echo "✓ Porta $APP_PORT in ascolto:"
        echo "$PORT_INFO"
    else
        echo "❌ Porta $APP_PORT NON in ascolto!"
        echo "   L'app non è avviata o è crashata."
    fi
fi

echo ""
echo "--- [6] Test HTTP locale ---"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:$APP_PORT 2>/dev/null || echo "FAIL")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ App risponde su http://localhost:$APP_PORT (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "FAIL" ]; then
    echo "❌ App NON risponde su localhost:$APP_PORT"
else
    echo "⚠ App risponde con HTTP $HTTP_CODE (atteso 200)"
fi

echo ""
echo "--- [7] Firewall ---"
if command -v ufw &> /dev/null; then
    UFW_STATUS=$(ufw status | head -1)
    echo "UFW: $UFW_STATUS"
    if echo "$UFW_STATUS" | grep -q "active"; then
        if ufw status | grep -q "$APP_PORT"; then
            echo "✓ Porta $APP_PORT aperta nel firewall"
        else
            echo "❌ Porta $APP_PORT BLOCCATA dal firewall! Esegui: ufw allow $APP_PORT/tcp"
        fi
    fi
fi
if command -v iptables &> /dev/null; then
    echo ""
    echo "Regole iptables INPUT (prime 10):"
    iptables -L INPUT -n --line-numbers 2>/dev/null | head -15
fi

echo ""
echo "--- [8] Log PM2 (ultime 30 righe) ---"
if command -v pm2 &> /dev/null; then
    pm2 logs ai-readiness --lines 30 --nostream 2>/dev/null || echo "Nessun log disponibile"
fi

echo ""
echo "=========================================="
echo " Diagnostica completata"
echo "=========================================="
