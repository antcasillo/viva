# viva.push.it — Scuola di Musica

Applicazione web per la gestione di una scuola di musica: direzione, insegnanti, allievi e genitori.

## Stack Tecnologico

- **Frontend:** React 19 + TypeScript + Vite
- **Routing:** react-router-dom (rotte protette, ruoli Admin/User)
- **Styling:** Tailwind CSS
- **Backend:** Express + SQLite (self-hosted) — con fallback a mock data se server non avviato

## Struttura del Progetto

```
viva-push-it/
├── server/
│   ├── migrations.js    # Schema DB unificato (stile gestionale-push)
│   ├── db.js             # SQLite + backup automatico
│   └── routes/           # API Express
├── src/
│   ├── components/       # Componenti riutilizzabili
│   ├── context/          # AuthContext, DataContext
│   ├── data/             # mockData.ts (fallback)
│   ├── layouts/          # AdminLayout, UserLayout
│   ├── lib/              # apiClient, dbMappers
│   ├── services/         # apiBackend.ts (CRUD verso Express)
│   ├── pages/            # Pagine per area
│   │   ├── admin/        # Dashboard, Allievi, Presenze, Contabile, Calendario, Bacheca, Utenti
│   │   └── user/         # Profilo, Prossime Lezioni, Pagamenti, Eventi
│   └── types/            # database.ts (schema TypeScript)
├── scripts/
│   └── seed-sqlite.cjs   # Popola SQLite con dati demo
└── .env.example
```

## Ruoli e Accesso

| Ruolo | Area | Percorso |
|-------|------|----------|
| **Admin** | Direzione/Insegnanti | `/admin` |
| **User** | Allievi/Genitori | `/area-utente` |

## Credenziali Demo (Mock)

| Username / Email | Password | Ruolo |
|------------------|----------|-------|
| admin | admin123 | Admin |
| genitore.bianchi@gmail.com | user123 | User |
| anna.verdi@email.it | user123 | User |

## Avvio

```bash
cd viva-push-it
npm install
npm run dev
```

Apri [http://localhost:5173](http://localhost:5173).

## Schema Database

Entità principali: **Profiles** (utenti), **Allievi**, **Corsi**, **Presenze**, **Pagamenti**, **Eventi**.

Schema unificato in `server/migrations.js` (stile gestionale-push: init_db + ALTER per nuove colonne). Vedi `src/types/database.ts`.

## Mock Data

- 5 allievi
- 3 corsi (Pianoforte, Chitarra, Canto)
- Storico presenze misto (presenti, assenti, preavvisati)
- 4 rette (2 pagate, 1 in attesa, 1 scaduta)
- 3 eventi futuri

## Prossimi Moduli

1. **Modulo 2:** CRUD Allievi, Registro Presenze, Situazione Contabile, Gestione Bacheca
2. **Modulo 3:** Calendario con react-big-calendar / FullCalendar
3. **Modulo 4:** Form assenze genitori, Integrazione SumUp per pagamenti online

## Backend SQLite (Database Reale)

**Guida dettagliata:** vedi [SETUP.md](./SETUP.md) per istruzioni passo-passo con comandi, output attesi e risoluzione problemi.

**Sintesi rapida:**
1. `npm install`
2. `npm run db:seed`
3. `npm run server` (terminale 1)
4. `npm run dev` (terminale 2)
5. Apri http://localhost:5173 e accedi con admin / admin123
