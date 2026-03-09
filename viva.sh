#!/bin/bash
# Deploy Viva - Path sul server: /var/www/viva.push.it
# Uso: ./viva.sh  oppure  /root/viva.sh
# Vedi DEPLOY.md per la guida completa

set -e
cd /var/www/viva.push.it

# Carica .env per build (VITE_API_URL, ecc.)
[ -f viva-push-it/.env ] && set -a && source viva-push-it/.env && set +a
[ -f viva-push-it/.env.production ] && set -a && source viva-push-it/.env.production && set +a

echo "⬇️ Scarico aggiornamenti da GitHub..."
git pull

# Aggiorna /root/viva.sh (wrapper)
[ -f scripts/root-viva.sh ] && sudo cp scripts/root-viva.sh /root/viva.sh && sudo chmod +x /root/viva.sh

cd viva-push-it

# Installa dipendenze solo se: node_modules manca, oppure package*.json sono cambiati nel pull
if [ ! -d node_modules ] || git diff --name-only ORIG_HEAD HEAD 2>/dev/null | grep -qE 'viva-push-it/package(-lock)?\.json'; then
  echo "📦 Installo dipendenze..."
  npm install
else
  echo "📦 Dipendenze invariate, salto npm install"
fi

# Seed DB se non esiste (solo la prima volta)
if [ ! -f data/viva.db ]; then
  echo "🌱 Creo database e dati iniziali..."
  npm run db:seed
fi

echo "🔨 Build frontend..."
npm run build

# Riavvia pm2 se installato
if command -v pm2 &> /dev/null; then
  echo "🔄 Riavvio server Node..."
  pm2 restart viva-push-it 2>/dev/null || true
fi

echo "✅ Deploy completato!"
echo "   Build: viva-push-it/dist/"
echo "   Guida: viva-push-it/DEPLOY.md"
