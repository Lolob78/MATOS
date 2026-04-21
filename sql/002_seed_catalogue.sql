-- Seed catalogue objets par catégorie
-- Exécuter UNE seule fois dans Supabase SQL Editor

insert into objets_catalogue (libelle, categorie_id) values
  -- DIVERS (id=1)
  ('Clamp de serrage', 1), ('Sac de sable 15kg', 1), ('Velcro 5m', 1),
  ('Ruban adhésif noir', 1), ('Marqueur indélébile', 1),

  -- DMX (id=2)
  ('Câble DMX 1m', 2), ('Câble DMX 3m', 2), ('Câble DMX 5m', 2),
  ('Câble DMX 10m', 2), ('Splitter DMX 4 sorties', 2),
  ('Splitter DMX 8 sorties', 2), ('Terminaison DMX', 2),

  -- LED (id=3)
  ('Astera Titan Tube', 3), ('Astera AX1 Pixel Tube', 3),
  ('Skypanel S60-C', 3), ('Skypanel S30-C', 3),
  ('Nanlux Evoke 1200B', 3), ('Nanlux Evoke 900C', 3),
  ('Aputure 600d Pro', 3), ('Aputure 300d II', 3),
  ('Aputure 120d II', 3), ('Quasar Science Q-LED 4ft', 3),
  ('LiteGear LiteMat 4', 3), ('LiteGear LiteMat 2L', 3),

  -- TUNGSTENE (id=4)
  ('Mandarine 2kW', 4), ('Mandarine 1kW', 4), ('Mandarine 650W', 4),
  ('Fresnel 2kW', 4), ('Fresnel 1kW', 4), ('Fresnel 650W', 4),
  ('Baby 1kW', 4), ('Blonde 2kW', 4),
  ('Dino 9 lampes', 4), ('Coupole 8 lampes', 4),

  -- HMI (id=5)
  ('HMI 4kW Fresnel', 5), ('HMI 2.5kW Fresnel', 5),
  ('HMI 1.2kW Fresnel', 5), ('HMI 575W Fresnel', 5),
  ('HMI 400W Pocket Par', 5), ('HMI 200W Pocket Par', 5),
  ('Ballast 4kW électronique', 5), ('Ballast 2.5kW électronique', 5),
  ('Ballast 1.2kW électronique', 5),

  -- CADRES/TOILES (id=6)
  ('Cadre 6x6 aluminium', 6), ('Cadre 4x4 aluminium', 6),
  ('Cadre 8x8 aluminium', 6), ('Toile diffusion 1/4 stop', 6),
  ('Toile diffusion 1/2 stop', 6), ('Toile diffusion 1 stop', 6),
  ('Toile blanche', 6), ('Toile noire', 6), ('Toile silver', 6),

  -- GRIP (id=7)
  ('Tête de bras articulé Manfrotto', 7), ('Bras magique 60cm', 7),
  ('Bras magique 40cm', 7), ('Pince menace', 7),
  ('Pince junior', 7), ('Multipince', 7),
  ('Ventouse simple', 7), ('Ventouse double', 7),

  -- MACHINERIE (id=8)
  ('Dolly Fisher', 8), ('Bras téléscopique', 8),
  ('Tête hydraulique', 8), ('Plateforme dolly', 8),

  -- PIEDS (id=9)
  ('Pied junior 3m', 9), ('Pied junior 2m', 9),
  ('Pied baby 2m', 9), ('Pied baby 1m20', 9),
  ('Pied C-stand 40cm', 9), ('Pied C-stand 20cm', 9),
  ('Pied salon', 9), ('Pied lourd 5m', 9),

  -- ENERGIE (id=10)
  ('Groupe électrogène 30kVA', 10), ('Groupe électrogène 20kVA', 10),
  ('Groupe électrogène 10kVA', 10), ('Coffret 63A tri', 10),
  ('Coffret 32A tri', 10), ('Batterie V-mount 190Wh', 10),
  ('Batterie Gold Mount 150Wh', 10), ('Chargeur V-mount 4 baies', 10),

  -- DISTRIBUTION (id=11)
  ('Câble HO7 50m 63A', 11), ('Câble HO7 25m 63A', 11),
  ('Câble HO7 50m 32A', 11), ('Câble HO7 25m 32A', 11),
  ('Multiprise 6 prises', 11), ('Prolongateur 25m 16A', 11),
  ('Prolongateur 50m 16A', 11), ('Répartiteur 63A→4×32A', 11),

  -- CONSOMMABLES (id=12)
  ('Gélatine CTO full', 12), ('Gélatine CTB full', 12),
  ('Gélatine CTO 1/2', 12), ('Gélatine CTB 1/2', 12),
  ('Diffusion 216', 12), ('Diffusion 250', 12),
  ('Diffusion 129', 12), ('ND 0.3 (1 stop)', 12),
  ('ND 0.6 (2 stops)', 12), ('ND 0.9 (3 stops)', 12),
  ('Black Wrap 15m', 12), ('Gels assortis', 12)

on conflict (libelle, categorie_id) do nothing;