#!/bin/bash
# Deploy Viva - Path sul server: /var/www/viva.push.it
# L'app React viene buildata e servita come sito statico da nginx

cd /var/www/viva.push.it

# Carica variabili da .env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY per build)
[ -f viva-push-it/.env ] && set -a && source viva-push-it/.env && set +a

echo "⬇️ Scarico aggiornamenti da GitHub..."
git pull

# Aggiorna /root/viva.sh (wrapper che punta a questo script)
[ -f scripts/root-viva.sh ] && sudo cp scripts/root-viva.sh /root/viva.sh && sudo chmod +x /root/viva.sh

echo "📦 Installo dipendenze e buildo..."
cd viva-push-it
npm ci
npm run build

echo "✅ Fatto! Build completato in viva-push-it/dist/"
echo "   Configura nginx: vedi docs/nginx_viva.conf.example"
