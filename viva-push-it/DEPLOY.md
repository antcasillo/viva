# Guida Deploy viva.push.it su VPS

Guida passo-passo per mettere online l'app su un server VPS (Ubuntu/Debian).

**Percorso sul server:** `/var/www/viva.push.it`  
**Script di deploy:** `viva.sh` (nella root del repo)

**Database:** SQLite (stile gestionale-push). Schema e migrazioni in `server/migrations.js`.

---

## Struttura cartelle sul server

```
/var/www/viva.push.it/          ← root repo (git pull, viva.sh)
├── viva.sh                     ← script di deploy
├── scripts/
│   └── root-viva.sh            ← wrapper per /root/viva.sh
└── viva-push-it/               ← progetto (package.json, server/, src/)
    ├── .env                    ← variabili server (JWT_SECRET, ecc.)
    ├── .env.production         ← VITE_API_URL per il build
    ├── package.json
    ├── server/
    │   ├── migrations.js       ← schema DB unificato (initDb)
    │   ├── db.js               ← SQLite + backup automatico
    │   └── routes/
    ├── src/
    └── data/                   ← database SQLite (creato da db:seed)
        ├── viva.db
        └── backups/            ← backup automatici (24 ultimi)
```

---

## Prerequisiti sul VPS

- **Node.js 18+** installato
- **Git** installato
- Accesso **root** o **sudo**

Per verificare:
```bash
node --version   # deve essere v18.x o superiore
git --version
```

Se Node.js non c'è:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## Parte 1: Deploy con viva.sh (aggiornamento rapido)

Dopo aver pushato modifiche su Git, sul server:

```bash
cd /var/www/viva.push.it
./viva.sh
```

Oppure, se hai installato il wrapper in /root:
```bash
/root/viva.sh
```

**Cosa fa lo script:**
1. `git pull` — scarica aggiornamenti
2. `npm install` — dipendenze
3. `npm run db:seed` — **solo se `data/viva.db` non esiste** (primo deploy)
4. `npm run build` — frontend React
5. `pm2 restart viva-push-it` — riavvia il server

**Migrazioni:** All'avvio il server esegue `initDb()` da `migrations.js`. Nuove colonne (ALTER TABLE) vengono applicate automaticamente al restart. Non serve eseguire comandi separati.

---

## Parte 2: Primo deploy da zero

### Passo 1: Clona il repository

```bash
cd /var/www
git clone https://github.com/TUO-USER/TUO-REPO.git viva.push.it
cd viva.push.it
```

**Importante:** il repo deve contenere la cartella `viva-push-it/` con `package.json`, `server/`, `src/`.

### Passo 2: Crea il file `.env`

Il file `.env` va in `viva-push-it/` (dove c'è package.json):

```bash
cd /var/www/viva.push.it/viva-push-it
nano .env
```

Contenuto (modifica dove indicato):

```
NODE_ENV=production
PORT=3001
JWT_SECRET=INSERISCI-QUI-UN-SEGRETO-CASUALE
FRONTEND_URL=https://viva.push.it
```

**Opzionale (primo avvio senza seed):** Se non esegui `db:seed` e vuoi creare l'admin da zero:
```
BOOTSTRAP_ADMIN_PASSWORD=tua-password-sicura
```
Verrà creato `admin@vivapush.it` con quella password. Poi rimuovi la variabile per sicurezza.

**Come generare JWT_SECRET:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copia l'output e incollalo al posto di `INSERISCI-QUI-UN-SEGRETO-CASUALE`.

Salva: `Ctrl+O`, `Invio`, `Ctrl+X`.

### Passo 3: Crea il file `.env.production`

Stessa cartella `viva-push-it/`:

```bash
nano .env.production
```

Contenuto (per viva.push.it):

```
VITE_API_URL=https://viva.push.it
```

Salva: `Ctrl+O`, `Invio`, `Ctrl+X`.

### Passo 4: Esegui il deploy

```bash
cd /var/www/viva.push.it
./viva.sh
```

### Passo 5: Installa e avvia pm2 (solo la prima volta)

```bash
sudo npm install -g pm2
cd /var/www/viva.push.it/viva-push-it
pm2 start server/index.js --name viva-push-it --env production
pm2 startup
pm2 save
```

---

## Parte 3: pm2 (mantenere il server sempre attivo)

### Installare pm2

```bash
sudo npm install -g pm2
```

### Avviare l'app

```bash
cd /var/www/viva.push.it/viva-push-it
pm2 start server/index.js --name viva-push-it --env production
```

### Comandi utili

```bash
pm2 list              # Vedi le app in esecuzione
pm2 logs viva-push-it # Vedi i log
pm2 restart viva-push-it  # Riavvia (viva.sh lo fa automaticamente)
pm2 stop viva-push-it
pm2 delete viva-push-it
```

### Avvio automatico al riavvio del server

```bash
pm2 startup
pm2 save
```

---

## Parte 4: Nginx (reverse proxy)

Il server Node gira sulla porta 3001. Nginx deve fare proxy verso di essa.

### Configurazione

```bash
sudo nano /etc/nginx/sites-available/viva.push.it
```

Contenuto (per viva.push.it):

```nginx
server {
    listen 80;
    server_name viva.push.it www.viva.push.it;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Attiva

```bash
sudo ln -s /etc/nginx/sites-available/viva.push.it /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### HTTPS con Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d viva.push.it -d www.viva.push.it
```

---

## Parte 5: Wrapper /root/viva.sh (opzionale)

Per eseguire il deploy da qualsiasi directory con `/root/viva.sh`:

```bash
sudo cp /var/www/viva.push.it/scripts/root-viva.sh /root/viva.sh
sudo chmod +x /root/viva.sh
```

Poi: `./viva.sh` copia automaticamente questo wrapper in `/root/viva.sh` a ogni deploy.

---

## Parte 6: Riepilogo – Aggiornare il sito

Dopo modifiche e push su Git:

```bash
cd /var/www/viva.push.it
./viva.sh
```

Oppure: `/root/viva.sh`

| Ordine | Azione | Quando |
|--------|--------|--------|
| 1 | `git pull` | Sempre |
| 2 | `npm install` | Sempre |
| 3 | `npm run db:seed` | Solo se `data/viva.db` non esiste |
| 4 | `npm run build` | Sempre |
| 5 | `pm2 restart` | Sempre (se pm2 installato) |

**Backup DB:** Il server crea backup automatici in `data/backups/` all'avvio e ogni ora (ultimi 24).

---

## Parte 7: Risoluzione problemi

### "package.json not found"
→ Sei nella cartella sbagliata. Il progetto è in `viva-push-it/`. Usa `cd /var/www/viva.push.it/viva-push-it`.

### "Cannot find module..."
→ `npm install` non è stato eseguito. Esegui `./viva.sh` dalla root.

### Il sito non carica / errore 502
→ Il server Node non è in esecuzione. Controlla `pm2 list` e avvia con `pm2 start`.

### Login non funziona
→ Controlla `JWT_SECRET` in `viva-push-it/.env`. Dopo modifiche: `pm2 restart viva-push-it`.

### L'app mostra "Errore caricamento dati"
→ Verifica:
1. `VITE_API_URL` in `viva-push-it/.env.production` = `https://viva.push.it`
2. Nginx fa proxy verso porta 3001
3. `pm2 list` mostra viva-push-it in esecuzione

### Database vuoto / nessun utente
→ Esegui `npm run db:seed` in `viva-push-it/` per creare dati demo. Oppure imposta `BOOTSTRAP_ADMIN_PASSWORD` in `.env` e riavvia (crea solo l'admin).

---

## Parte 8: Aggiornamenti schema (nuove colonne)

Se hai modificato `server/migrations.js` aggiungendo colonne in `alterColumns`:

1. Fai deploy: `./viva.sh`
2. Al restart, `initDb()` applica automaticamente le nuove colonne
3. Nessun comando manuale necessario

---

## Credenziali dopo il seed

- **Admin:** admin@vivapush.it / admin123
- **Genitore demo:** genitore.bianchi@gmail.com / user123
