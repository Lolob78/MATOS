import { supabase } from '../supabase.js';
import { CATEGORIES_FALLBACK } from '../config.js';

// Cache local pour éviter les allers-retours répétés
let _cache = null;

export async function getCategories() {
  if (_cache) return _cache;
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order');
  if (error) {
    console.warn('Fallback catégories (erreur réseau)', error);
    return CATEGORIES_FALLBACK.map((name, i) => ({ id: i + 1, name, sort_order: i + 1 }));
  }
  _cache = data;
  return data;
}

// Invalide le cache après ajout d'une catégorie (Étape 5 paramètres)
export function invalidateCategoriesCache() {
  _cache = null;
}

export async function createCategorie(name) {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name: name.toUpperCase().trim(), sort_order: 99 })
    .select()
    .single();
  if (error) throw error;
  invalidateCategoriesCache();
  return data;
}