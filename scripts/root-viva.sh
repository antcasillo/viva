#!/bin/bash
# Wrapper: esegue lo script di deploy da /var/www/viva.push.it
# Installa con: sudo cp /var/www/viva.push.it/scripts/root-viva.sh /root/viva.sh && sudo chmod +x /root/viva.sh
exec /var/www/viva.push.it/viva.sh "$@"
