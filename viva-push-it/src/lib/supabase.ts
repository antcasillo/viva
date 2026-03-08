/**
 * Client Supabase - Configurazione per backend reale
 * Per ora l'app usa mock data. Per attivare Supabase:
 * 1. Crea un progetto su supabase.com
 * 2. Aggiungi VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY in .env
 * 3. Esegui le migration dello schema in supabase/migrations/
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = (): boolean => !!supabase;
