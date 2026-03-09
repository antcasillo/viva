# Guida Deploy viva.push.it su VPS

**Percorso sul server:** `/var/www/viva.push.it`  
**Database:** SQLite (stile gestionale-push). Schema in `server/migrations.js`.

---

## Aggiornare il sito (uso quotidiano)

Dopo aver pushato modifiche su Git:

```bash
cd /var/www/viva.push.it
./viva.sh
```

Oppure: `/root/viva.sh` (se hai installato il wrapper)

| Ordine | Azione | Quando |
|--------|--------|--------|
| 1 | `git pull` | Sempre |
| 2 | `npm install` | Sempre |
| 3 | `npm run db:seed` | Solo se `data/viva.db` non esiste |
| 4 | `npm run build` | Sempre |
| 5 | `pm2 restart viva-push-it` | Sempre (se pm2 installato) |

**Migrazioni:** All'avvio il server esegue `initDb()` da `migrations.js`. Nuove colonne (in `alterColumns`) vengono applicate automaticamente al restart. Nessun comando manuale.

**Backup DB:** Backup automatici in `data/backups/` all'avvio e ogni ora (ultimi 24).

---

## Struttura cartelle sul server

```
/var/www/viva.push.it/
├── viva.sh
├── scripts/root-viva.sh
└── viva-push-it/
    ├── .env
    ├── .env.production
    ├── server/ (migrations.js, db.js, routes/)
    ├── src/
    └── data/ (viva.db, backups/)
```

---

## Risoluzione problemi

### "package.json not found"
→ `cd /var/www/viva.push.it/viva-push-it`

### "Cannot find module..."
→ Esegui `./viva.sh` dalla root del repo.

### Il sito non carica / errore 502
→ `pm2 list` — se manca: `pm2 start server/index.js --name viva-push-it --cwd /var/www/viva.push.it/viva-push-it`

### Login non funziona
→ Controlla `JWT_SECRET` in `viva-push-it/.env`. Poi `pm2 restart viva-push-it`.

### L'app mostra "Errore caricamento dati"
→ Verifica `VITE_API_URL` in `.env.production`, Nginx su porta 3001, `pm2 list`.

### Vedo sempre i dati mock (Maria Rossi, Luca Bianchi, ecc.)
→ **VITE_API_URL non è nel build.** Controlla che `.env.production` esista in `viva-push-it/` con:
   ```
   VITE_API_URL=https://viva.push.it
   ```
   (sostituisci con il tuo dominio se diverso). Poi **ricompila**:
   ```bash
   cd /var/www/viva.push.it/viva-push-it
   npm run build
   pm2 restart viva-push-it
   ```
   Le variabili Vite vengono incluse solo al momento del build. Se manca `.env.production` o è sbagliato, il frontend userà sempre i mock.

### Database vuoto
→ `cd viva-push-it && npm run db:seed`

---

## Credenziali demo (dopo seed)

- **Admin:** admin / admin123
- **Genitore:** genitore.bianchi@gmail.com / user123

**Cambio password:** Dopo il primo accesso, admin e utenti possono cambiare la propria password:
- **Admin:** menu Profilo → Cambia password
- **Utenti:** area Profilo personale → Cambia password
- **Admin reimposta altri utenti:** Gestione Utenti → Modifica → Nuova password

**Foto profilo:** Admin e utenti possono caricare la propria foto da Profilo. Le foto sono salvate in `data/uploads/avatars/`. Se non caricata, viene mostrato un pallino con le iniziali. Al cambio foto, la vecchia viene eliminata.

---

## Appendice: Primo deploy da zero (nuovo server)

Prerequisiti: Node.js 18+, Git. Se manca Node: `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs`

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

### Passo 5: Installa pm2 e avvia

```bash
sudo npm install -g pm2
cd /var/www/viva.push.it/viva-push-it
pm2 start server/index.js --name viva-push-it --env production
pm2 startup
pm2 save
```

### Passo 6: Nginx (reverse proxy)

Il server Node gira sulla porta 3001. Nginx deve fare proxy verso di essa.

```bash
sudo nano /etc/nginx/sites-available/viva.push.it
```

Contenuto (per viva.push.it). **Non copiare** la riga ` ```nginx ` — incolla solo il blocco `server { ... }`:

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

```bash
sudo ln -s /etc/nginx/sites-available/viva.push.it /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Passo 7: HTTPS con Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d viva.push.it -d www.viva.push.it
```

### Comandi utili pm2

```bash
pm2 list
pm2 logs viva-push-it
pm2 restart viva-push-it
```

### Wrapper /root/viva.sh (opzionale)

```bash
sudo cp /var/www/viva.push.it/scripts/root-viva.sh /root/viva.sh
sudo chmod +x /root/viva.sh
```

Poi: `/root/viva.sh` da qualsiasi directory.
