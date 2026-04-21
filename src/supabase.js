import { createClient } from '@supabase/supabase-js';

// Variables d'env exposées au front par Vite (préfixe VITE_ obligatoire)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Variables Supabase manquantes. Copie .env.example vers .env.local et renseigne tes clés.'
  );
}

// Client unique partagé dans toute l'app
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,        // garde la session dans localStorage
    autoRefreshToken: true,      // refresh auto du JWT
    detectSessionInUrl: true     // détecte le token dans l'URL après clic magic link
  }
});