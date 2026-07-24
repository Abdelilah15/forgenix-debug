import { createClient } from '@supabase/supabase-js';

// Récupération des variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Les variables d’environnement Supabase publiques sont manquantes.');
}

/**
 * CLIENT PUBLIC
 * Utilisé côté client (navigateur) ou serveur pour des requêtes en lecture seule.
 * Ce client est soumis aux règles RLS (Row Level Security).
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * CLIENT ADMIN (SERVICE ROLE)
 * ⚠️ NE JAMAIS EXPOSER CE CLIENT CÔTÉ NAVIGATEUR.
 * À utiliser uniquement dans les routes API (/api/admin/...) pour des opérations CRUD
 * après avoir vérifié que l'utilisateur est bien autorisé via le Smart Contract.
 */
export const supabaseAdmin = () => {
  if (!supabaseServiceKey) {
    throw new Error('La clé Supabase Service Role est manquante.');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
};
