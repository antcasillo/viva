# Guida al deploy di Viva

Questa guida spiega come mettere online Viva su un server (VPS, cloud, ecc.).

---

## Prerequisiti

- Un server con **Ubuntu** (o simile Linux)
- Accesso SSH al server
- Il dominio **viva.push.it** che punta all’IP del server (record A o CNAME)

---

## 1. Clonare il repo sul server

Collegati al server via SSH:

```bash
ssh utente@tuo-server
```

Poi esegui:

```bash
# Crea la cartella se non esiste
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www

# Clona il repository (sostituisci con il tuo URL GitHub)
cd /var/www
git clone https://github.com/antcasillo/viva.git viva.push.it

cd viva.push.it
```

Se il repo è privato, GitHub chiederà le credenziali. Puoi usare un [Personal Access Token](https://github.com/settings/tokens) al posto della password.

---

## 2. Creare il file .env (opzionale)

Serve solo se usi **Supabase** come backend. Se usi solo dati mock, puoi saltare questo passo.

```bash
cd /var/www/viva.push.it/viva-push-it
cp .env.example .env
nano .env
```

Nel file `.env` inserisci (senza virgolette):

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Salva con `Ctrl+O`, `Invio`, esci con `Ctrl+X`.

Se **non** usi Supabase, puoi lasciare il file vuoto o con le righe commentate.

---

## 3. Installare Node.js e fare il primo deploy

```bash
# Installa Node.js 20 (se non ce l'hai già)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Esegui lo script di deploy (prima volta)
cd /var/www/viva.push.it
./viva.sh

# Opzionale: installa /root/viva.sh per usare "viva.sh" da qualsiasi directory
sudo cp /var/www/viva.push.it/scripts/root-viva.sh /root/viva.sh
sudo chmod +x /root/viva.sh
# Da ora puoi eseguire: /root/viva.sh
```

---

## 4. Configurare nginx

### 4a. Installa nginx (se non è già installato)

```bash
sudo apt update
sudo apt install -y nginx
```

### 4b. Copia la configurazione

```bash
sudo cp /var/www/viva.push.it/docs/nginx_viva.conf.example /etc/nginx/sites-available/viva.push.it
```

### 4c. Abilita il sito

```bash
sudo ln -s /etc/nginx/sites-available/viva.push.it /etc/nginx/sites-enabled/
```

### 4d. Se non hai ancora SSL (solo HTTP per test)

Crea una versione temporanea senza HTTPS:

```bash
sudo nano /etc/nginx/sites-available/viva.push.it
```

Sostituisci tutto il contenuto con:

```nginx
server {
    listen 80;
    server_name viva.push.it;

    root /var/www/viva.push.it/viva-push-it/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 4e. Ottieni il certificato SSL (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d viva.push.it
```

Segui le istruzioni. Certbot aggiornerà automaticamente la config nginx per usare HTTPS.

### 4f. Verifica e ricarica nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Deploy successivi

Dopo la prima configurazione, per aggiornare il sito:

```bash
/root/viva.sh
```

oppure:

```bash
cd /var/www/viva.push.it
./viva.sh
```

Nessun riavvio di nginx: serve direttamente i file dalla cartella `dist/`.
