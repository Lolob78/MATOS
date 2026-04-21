import { supabase } from '../supabase.js';

// Récupère tous les projets triés par date de début desc
export async function getProjets() {
  const { data, error } = await supabase
    .from('projets')
    .select('*')
    .order('date_debut', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data;
}

// Récupère un projet par son id
export async function getProjet(id) {
  const { data, error } = await supabase
    .from('projets')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// Crée un projet, retourne l'objet créé
export async function createProjet(fields) {
  const { data, error } = await supabase
    .from('projets')
    .insert(fields)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Met à jour un projet
export async function updateProjet(id, fields) {
  const { data, error } = await supabase
    .from('projets')
    .update(fields)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Supprime un projet (cascade sur listes + lignes via FK)
export async function deleteProjet(id) {
  const { error } = await supabase
    .from('projets')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Récupère l'équipe d'un projet (personnes + rôles)
export async function getEquipe(projetId) {
  const { data, error } = await supabase
    .from('projet_personnes')
    .select(`
      role,
      personnes (id, nom, prenom, email, telephone)
    `)
    .eq('projet_id', projetId)
    .order('role');
  if (error) throw error;
  return data;
}

// Ajoute une personne à l'équipe d'un projet
export async function addMembreEquipe(projetId, personneId, role) {
  const { error } = await supabase
    .from('projet_personnes')
    .insert({ projet_id: projetId, personne_id: personneId, role });
  if (error) throw error;
}

// Retire une personne de l'équipe d'un projet
export async function removeMembreEquipe(projetId, personneId, role) {
  const { error } = await supabase
    .from('projet_personnes')
    .delete()
    .eq('projet_id', projetId)
    .eq('personne_id', personneId)
    .eq('role', role);
  if (error) throw error;
}