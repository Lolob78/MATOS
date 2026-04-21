# MATOS

Gestion de listes de matériel lumière pour chef électricien cinéma.
Webapp mobile-first (PWA) + Supabase.

## Stack
- Vite + Vanilla JS (ES modules)
- Tailwind CSS + Material Symbols
- Supabase (Auth magic link + Postgres + RLS)
- pdfmake (génération PDF côté client, Étape 4)
- vite-plugin-pwa

## Setup

### 1. Supabase
1. Créer un projet sur https://supabase.com (région Frankfurt)
2. Exécuter `sql/001_schema.sql` dans le SQL Editor
3. Authentication → URL Configuration : ajouter `http://localhost:5173/**` dans Redirect URLs
4. Authentication → Users → Add user : créer ton compte manuellement

### 2. Front
```bash
cp .env.example .env.local
# renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

Ouvre http://localhost:5173, saisis ton email, clique sur le magic link reçu.

## Convention Git
- `dev` : développement courant
- `staging` : pré-prod / tests
- `main` : prod (Cloudflare Pages auto-deploy)

## Avancement
- [x] Étape 1 — Socle (auth magic link)
- [ ] Étape 2 — Projets + Carnet d'adresses
- [ ] Étape 3 — Catalogue + Liste matériel
- [ ] Étape 4 — PDF
- [ ] Étape 5 — PWA + déploiement Cloudflare Pages
# MATOS

Application web PWA de gestion de listes matériel pour projets événementiels.

## Stack

- **Vite** — bundler & dev server
- **Tailwind CSS** — utility-first CSS
- **Supabase** — auth (magic link) + base de données PostgreSQL + RLS
- **pdfmake** — génération PDF côté client
- **vite-plugin-pwa** — Service Worker + manifest

## Installation

```bash
npm install
```

Renseigner les clés dans `.env.local` (copier depuis `.env.example`) :

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Base de données

Exécuter dans l'éditeur SQL de Supabase :

1. `sql/001_schema.sql` — tables, RLS, triggers
2. `sql/002_seed_exemple.sql` — données d'exemple (optionnel)

## Développement

```bash
npm run dev      # http://localhost:5173
npm run build    # dist/
npm run preview  # aperçu du build
```

## Structure

```
src/
  main.js          # bootstrap + auth check
  router.js        # routeur hash-based (#/projets, #/projet/:id…)
  state.js         # pub/sub global léger
  supabase.js      # client Supabase
  config.js        # constantes (nom, email, logo)
  api/             # CRUD par entité
  views/           # pages (render(root, params))
  components/      # modal, toast, autocomplete, confirm
  pdf/             # génération pdfmake
  styles/          # Tailwind + classes custom
  utils/           # helpers dom & date
sql/
  001_schema.sql   # schéma complet + RLS
  002_seed_exemple.sql
```
