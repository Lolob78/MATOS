import { supabase } from '../supabase.js';

// Recherche objets par catégorie + terme (min 1 caractère)
// Triés par usage_count desc → les plus utilisés remontent en premier
export async function searchObjets(categorieId, terme) {
  let query = supabase
    .from('objets_catalogue')
    .select('id, libelle, usage_count')
    .eq('categorie_id', categorieId)
    .order('usage_count', { ascending: false })
    .order('libelle')
    .limit(10);

  if (terme && terme.trim().length > 0) {
    // ilike = case-insensitive LIKE, % = wildcard
    query = query.ilike('libelle', `%${terme.trim()}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Crée un objet dans le catalogue s'il n'existe pas (upsert sur libelle + categorie_id)
// Retourne l'objet existant ou créé
export async function getOrCreateObjet(libelle, categorieId) {
  const libelleClean = libelle.trim();

  // Tente d'abord de trouver l'objet existant
  const { data: existing } = await supabase
    .from('objets_catalogue')
    .select('id, libelle')
    .eq('categorie_id', categorieId)
    .ilike('libelle', libelleClean)
    .maybeSingle();

  if (existing) return existing;

  // Sinon on crée
  const { data, error } = await supabase
    .from('objets_catalogue')
    .insert({ libelle: libelleClean, categorie_id: categorieId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Incrémente le compteur d'usage (appelé à chaque ajout à une liste)
export async function incrementUsage(objetId) {
  // RPC ou update direct — on fait un update simple
  const { data: obj } = await supabase
    .from('objets_catalogue')
    .select('usage_count')
    .eq('id', objetId)
    .single();

  await supabase
    .from('objets_catalogue')
    .update({ usage_count: (obj?.usage_count ?? 0) + 1 })
    .eq('id', objetId);
}