// Paramètres applicatifs MATOS
// Les infos "user" apparaissent sur le PDF (entête). À compléter avant le premier build PDF.

export const APP_CONFIG = {
  user: {
    name: 'Hugo Boutiller',
    email: 'Hugo.boutiller@gmail.com',
    phone: '+33783057327',
    logoUrl: '/logo.png'
  }
};

// Rôles fermés pour l'onglet Équipe d'un projet
export const ROLES = [
  'Réalisation',
  'Production',
  'Dir. Prod',
  'Chef Op',
  'Chef Elec'
];

// Catégories de fallback (la source de vérité reste la table DB `categories`)
// Utilisé uniquement en cas d'échec de chargement réseau ou premier boot
export const CATEGORIES_FALLBACK = [
  'DIVERS', 'DMX', 'LED', 'TUNGSTENE', 'HMI',
  'CADRES/TOILES', 'GRIP', 'MACHINERIE', 'PIEDS',
  'ENERGIE', 'DISTRIBUTION', 'CONSOMMABLES'
];