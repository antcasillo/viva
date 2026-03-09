# Guida Setup viva.push.it — SQLite + Backend

Questa guida descrive **esattamente** cosa fare per far funzionare l'app con il database reale.

**Funzionalità admin:** Gestione Allievi, **Corsi** (crea/modifica/elimina), Registro Presenze, **Situazione Contabile** (crea/modifica/elimina pagamenti), **Calendario** (eventi editabili, clic su data vuota per nuovo evento), Bacheca Eventi, Gestione Utenti.

---

## Prerequisiti

- **Node.js** 18 o superiore installato
- **npm** (viene con Node.js)

Per verificare:
```bash
node --version   # deve mostrare v18.x o superiore
npm --version
```

---

## Passo 1: Entrare nella cartella del progetto

Apri il terminale e vai nella cartella del progetto:

```bash
cd /Users/antonellocasillo/Documents/viva/viva-push-it
```

(Oppure, se sei già nella cartella `viva`, usa: `cd viva-push-it`)

---

## Passo 2: Installare le dipendenze

Esegui:

```bash
npm install
```

**Cosa succede:** npm scarica tutte le librerie necessarie (React, Express, SQLite, ecc.) nella cartella `node_modules`.

**Tempo indicativo:** 30–60 secondi.

**Se vedi errori:** assicurati di avere Node.js 18+ e una connessione internet attiva.

---

## Passo 3: Creare il database e i dati iniziali

Esegui:

```bash
npm run db:seed
```

**Cosa succede:**
1. Viene creata la cartella `data/` (se non esiste)
2. Viene creato il file `data/viva.db` (database SQLite)
3. Vengono create le tabelle tramite `server/migrations.js` (stile gestionale-push)
4. Vengono inseriti 6 utenti, 5 allievi, 3 corsi, iscrizioni, presenze, pagamenti e 3 eventi

**Output atteso:**
```
🌱 Seed SQLite viva.push.it...

  ✓ Creato: admin@vivapush.it
  ✓ Creato: genitore.bianchi@gmail.com
  ...
  ✓ Corsi creati: 3
  ✓ Allievi creati: 5
  ✓ Iscrizioni create
  ✓ Presenze create
  ✓ Pagamenti creati
  ✓ Eventi creati

✅ Seed completato!

Credenziali: admin@vivapush.it / admin123
```

**Se esegui di nuovo:** gli utenti già presenti vengono saltati; corsi, allievi e dati correlati vengono creati solo se le tabelle sono vuote. **I tuoi dati (nome admin modificato, allievi creati, ecc.) restano salvati** finché non elimini il database.

---

## Passo 4: Avviare backend e frontend (un solo comando)

Esegui:

```bash
npm run dev:all
```

**Cosa succede:** si avviano insieme il server backend (porta 3001) e il frontend (porta 5173) nello stesso terminale.

**Output atteso:** vedrai i log di entrambi. L'app sarà pronta quando compare:
```
➜  Local:   http://localhost:5173/
```

**Per fermare tutto:** premi `Ctrl+C` nel terminale.

---

### Alternativa: due terminali separati

Se preferisci tenere backend e frontend separati:

**Terminale 1:**
```bash
npm run server
```

**Terminale 2:**
```bash
npm run dev
```

---

## Passo 6: Aprire l'app nel browser

1. Apri il browser (Chrome, Firefox, Safari, ecc.)
2. Vai all’indirizzo: **http://localhost:5173**
3. Dovresti vedere la home di viva.push.it

---

## Passo 7: Effettuare il login

1. Clicca su **Accedi** (o vai a http://localhost:5173/login)
2. Inserisci:
   - **Email:** `admin@vivapush.it`
   - **Password:** `admin123`
3. Spunta "Resta connesso per 30 giorni" se vuoi
4. Clicca **Accedi**

**Risultato atteso:** vieni reindirizzato alla Dashboard admin.

**Se vedi "Email o password non corretti":**
- Controlla di aver eseguito `npm run db:seed` (Passo 3)
- Controlla che il server backend sia in esecuzione (Passo 4)
- Verifica di non aver modificato email o password

---

## Backup automatico del database

Il database viene salvato automaticamente:
- **All'avvio del server**: copia di `data/viva.db` in `data/backups/viva-YYYYMMDDHHMMSS.db`
- **Ogni ora**: nuovo backup (vengono mantenuti gli ultimi 24)

Per un backup manuale: `npm run db:backup`

---

## Riepilogo ordine operazioni

| Ordine | Comando            | Cosa fa                         |
|--------|--------------------|---------------------------------|
| 1      | `npm install`      | Installa dipendenze             |
| 2      | `npm run db:seed`  | Crea DB e dati iniziali (solo la prima volta) |
| 3      | `npm run dev:all`  | Avvia backend + frontend insieme |
| 4      | Apri browser       | http://localhost:5173          |

---

## Credenziali demo

| Ruolo  | Email                        | Password |
|--------|------------------------------|----------|
| Admin  | admin@vivapush.it            | admin123 |
| Genitore | genitore.bianchi@gmail.com | user123  |
| Genitore | anna.verdi@email.it        | user123  |

---

## Risoluzione problemi

### "Errore caricamento dati" o schermata bianca dopo il login
- **Causa:** il frontend non riesce a raggiungere il backend.
- **Cosa fare:** verifica che il server sia avviato (`npm run server`) e che mostri "in ascolto su http://localhost:3001".

### "Email o password non corretti"
- **Cosa fare:** prova con `admin@vivapush.it` / `admin123`. Se hai cambiato la password e non la ricordi, dovrai ricominciare da zero (vedi sotto).

### Porta 3001 o 5173 già in uso
- **Cosa fare:** chiudi altre applicazioni che usano quelle porte, oppure modifica la porta nel codice (vedi `server/index.js` per la 3001, `vite.config.ts` per la 5173).

### Vuoi ricominciare da zero

```bash
# Elimina il database
rm -rf data/viva.db

# Ricrea tutto
npm run db:seed
```

Poi riavvia il server con `npm run server`.

---

**ATTENZIONE:** Questa operazione **cancella tutti i dati** (nome admin modificato, allievi creati, pagamenti, eventi, ecc.). Usala solo se vuoi davvero ripartire da zero.

---

## Deploy in produzione (sul tuo server)

1. **Sul tuo server**, esegui:
   ```bash
   cd /percorso/viva-push-it
   npm install
   npm run db:seed
   npm run build
   ```

2. **Crea un file `.env`** nella root del progetto con:
   ```
   NODE_ENV=production
   PORT=3001
   JWT_SECRET=una-stringa-segreta-lunga-e-casuale
   ```
   Per il primo avvio senza seed: `BOOTSTRAP_ADMIN_PASSWORD=tua-password` crea l'admin iniziale.

3. **Avvia il server** (es. con `pm2` o `systemd`):
   ```bash
   NODE_ENV=production node server/index.js
   ```

4. **Configura il frontend** per il build di produzione:
   - Crea un `.env.production` con `VITE_API_URL=https://tuodominio.it`
   - Esegui `npm run build`
   - Il server serve già i file statici da `dist/` quando `NODE_ENV=production`

5. **Esponi** la porta 3001 (o quella che usi) tramite reverse proxy (nginx, Caddy, ecc.).
