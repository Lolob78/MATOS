import { supabase } from '../supabase.js';

// ── Listes matériel ─────────────────────────────────────────────

export async function getListesDuProjet(projetId) {
  const { data, error } = await supabase
    .from('listes_materiel')
    .select('*')
    .eq('projet_id', projetId)
    .order('version', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getListe(id) {
  const { data, error } = await supabase
    .from('listes_materiel')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// Crée une nouvelle version (numéro auto = max existant + 1)
export async function createListe(projetId, fields = {}) {
  // Calcule le prochain numéro de version
  const { data: existing } = await supabase
    .from('listes_materiel')
    .select('version')
    .eq('projet_id', projetId)
    .order('version', { ascending: false })
    .limit(1);

  const nextVersion = existing?.length > 0 ? existing[0].version + 1 : 1;

  const { data, error } = await supabase
    .from('listes_materiel')
    .insert({ projet_id: projetId, version: nextVersion, ...fields })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateListe(id, fields) {
  const { data, error } = await supabase
    .from('listes_materiel')
    .update(fields)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteListe(id) {
  const { error } = await supabase
    .from('listes_materiel')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Duplique une liste existante (entête + toutes ses lignes)
export async function dupliquerListe(sourceId, projetId) {
  // 1. Récupère la source avec ses lignes
  const { data: source, error: e1 } = await supabase
    .from('listes_materiel')
    .select('*, lignes_liste(*)')
    .eq('id', sourceId)
    .single();
  if (e1) throw e1;

  // 2. Crée la nouvelle liste
  const newListe = await createListe(projetId, {
    date_sortie: source.date_sortie,
    date_rendu:  source.date_rendu,
    notes:       source.notes
  });

  // 3. Duplique les lignes si elles existent
  if (source.lignes_liste?.length > 0) {
    const lignes = source.lignes_liste.map(({ objet_id, quantite, remarques, position }) => ({
      liste_id: newListe.id,
      objet_id,
      quantite,
      remarques,
      position
    }));
    const { error: e2 } = await supabase.from('lignes_liste').insert(lignes);
    if (e2) throw e2;
  }

  return newListe;
}

// ── Lignes de liste ─────────────────────────────────────────────

// Récupère les lignes avec les infos objet + catégorie, groupées
export async function getLignesDeListe(listeId) {
  const { data, error } = await supabase
    .from('lignes_liste')
    .select(`
      id, quantite, remarques, position,
      objets_catalogue (
        id, libelle,
        categories (id, name, sort_order)
      )
    `)
    .eq('liste_id', listeId)
    .order('position');
  if (error) throw error;
  return data;
}

export async function addLigne(listeId, objetId, quantite, remarques = null) {
  // Position = max existant + 1 pour cette liste
  const { data: existing } = await supabase
    .from('lignes_liste')
    .select('position')
    .eq('liste_id', listeId)
    .order('position', { ascending: false })
    .limit(1);

  const position = existing?.length > 0 ? existing[0].position + 1 : 0;

  const { data, error } = await supabase
    .from('lignes_liste')
    .insert({ liste_id: listeId, objet_id: objetId, quantite, remarques, position })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateLigne(id, fields) {
  const { data, error } = await supabase
    .from('lignes_liste')
    .update(fields)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteLigne(id) {
  const { error } = await supabase
    .from('lignes_liste')
    .delete()
    .eq('id', id);
  if (error) throw error;
}