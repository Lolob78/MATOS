import { supabase } from '../supabase.js';

export async function getPersonnes() {
  const { data, error } = await supabase
    .from('personnes')
    .select('*')
    .order('nom')
    .order('prenom');
  if (error) throw error;
  return data;
}

export async function createPersonne(fields) {
  const { data, error } = await supabase
    .from('personnes')
    .insert(fields)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePersonne(id, fields) {
  const { data, error } = await supabase
    .from('personnes')
    .update(fields)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePersonne(id) {
  const { error } = await supabase
    .from('personnes')
    .delete()
    .eq('id', id);
  if (error) throw error;
}