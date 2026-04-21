-- =========================================
--  MATOS — Schéma de base de données V1
-- =========================================

-- Catégories (configurables, avec ordre d'affichage)
create table categories (
  id          bigserial primary key,
  name        text not null unique,
  sort_order  int  not null default 0,
  created_at  timestamptz default now()
);

-- Carnet d'adresses (personnes réutilisables)
create table personnes (
  id          uuid primary key default gen_random_uuid(),
  nom         text not null,
  prenom      text not null,
  email       text,
  telephone   text,
  created_at  timestamptz default now()
);

-- Projets
create table projets (
  id                  uuid primary key default gen_random_uuid(),
  nom                 text not null,
  realisateur         text,
  producteur          text,
  directeur_prod      text,
  chef_operateur      text,
  date_debut          date,
  date_fin            date,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Liaison projets <-> personnes (onglet Équipe)
-- Rôle = liste fermée côté front (Réalisation, Production, Dir. Prod, Chef Op, Chef Elec)
create table projet_personnes (
  projet_id   uuid references projets(id) on delete cascade,
  personne_id uuid references personnes(id) on delete cascade,
  role        text not null,
  primary key (projet_id, personne_id, role)
);

-- Catalogue d'objets louables (référentiel réutilisable, auto-enrichi)
create table objets_catalogue (
  id           uuid primary key default gen_random_uuid(),
  libelle      text not null,
  categorie_id bigint not null references categories(id) on delete restrict,
  usage_count  int default 0,
  created_at   timestamptz default now(),
  unique (libelle, categorie_id)
);

-- Listes de matériel (versions par projet)
create table listes_materiel (
  id          uuid primary key default gen_random_uuid(),
  projet_id   uuid not null references projets(id) on delete cascade,
  version     int  not null,
  date_sortie date,
  date_rendu  date,
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (projet_id, version)
);

-- Lignes d'une liste (objets concrets avec quantité)
create table lignes_liste (
  id              uuid primary key default gen_random_uuid(),
  liste_id        uuid not null references listes_materiel(id) on delete cascade,
  objet_id        uuid not null references objets_catalogue(id) on delete restrict,
  quantite        int  not null check (quantite > 0),
  remarques       text,
  position        int  default 0,
  created_at      timestamptz default now()
);

-- Index utiles
create index idx_lignes_liste_liste    on lignes_liste(liste_id);
create index idx_objets_categorie      on objets_catalogue(categorie_id);
create index idx_listes_projet         on listes_materiel(projet_id);
create index idx_projet_personnes_proj on projet_personnes(projet_id);
create index idx_objets_libelle_trgm   on objets_catalogue using gin (libelle gin_trgm_ops);

-- Extension pour la recherche fuzzy dans l'autocomplete (Étape 3)
create extension if not exists pg_trgm;

-- Seed des 12 catégories par défaut
insert into categories (name, sort_order) values
  ('DIVERS', 1), ('DMX', 2), ('LED', 3), ('TUNGSTENE', 4),
  ('HMI', 5), ('CADRES/TOILES', 6), ('GRIP', 7), ('MACHINERIE', 8),
  ('PIEDS', 9), ('ENERGIE', 10), ('DISTRIBUTION', 11), ('CONSOMMABLES', 12);

-- =========================================
--  RLS (Row Level Security) — mono-user V1
-- =========================================
alter table categories        enable row level security;
alter table personnes         enable row level security;
alter table projets           enable row level security;
alter table projet_personnes  enable row level security;
alter table objets_catalogue  enable row level security;
alter table listes_materiel   enable row level security;
alter table lignes_liste      enable row level security;

create policy "auth_all" on categories        for all to authenticated using (true) with check (true);
create policy "auth_all" on personnes         for all to authenticated using (true) with check (true);
create policy "auth_all" on projets           for all to authenticated using (true) with check (true);
create policy "auth_all" on projet_personnes  for all to authenticated using (true) with check (true);
create policy "auth_all" on objets_catalogue  for all to authenticated using (true) with check (true);
create policy "auth_all" on listes_materiel   for all to authenticated using (true) with check (true);
create policy "auth_all" on lignes_liste      for all to authenticated using (true) with check (true);

-- Trigger updated_at pour projets et listes_materiel
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_projets_updated
  before update on projets
  for each row execute function set_updated_at();

create trigger trg_listes_updated
  before update on listes_materiel
  for each row execute function set_updated_at();