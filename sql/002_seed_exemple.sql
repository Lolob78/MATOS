-- Seed optionnel : quelques catégories et objets catalogue d'exemple
-- À exécuter APRÈS 001_schema.sql

insert into categories (nom, ordre) values
  ('Éclairage',   1),
  ('Son',         2),
  ('Structure',   3),
  ('Câblage',     4),
  ('Divers',      5);

insert into catalogue (nom, categorie_id, unite, usage_count) values
  ('PAR LED 64', 1, 'u', 0),
  ('Lyre wash',  1, 'u', 0),
  ('Câble DMX 5m', 4, 'u', 0),
  ('Câble secteur 3m', 4, 'u', 0),
  ('Multiprise 6 prises', 4, 'u', 0),
  ('Sono colonne', 2, 'u', 0),
  ('Câble XLR 10m', 2, 'u', 0),
  ('Console lumière', 1, 'u', 0),
  ('Truss carré 2m', 3, 'u', 0),
  ('Pied d''éclairage', 1, 'u', 0);
