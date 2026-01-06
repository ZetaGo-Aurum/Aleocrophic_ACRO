import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

/**
 * Inisialisasi Supabase Client dengan Error Handling Komprehensif.
 * Digunakan di sisi client untuk operasi database yang mematuhi kebijakan RLS.
 * 
 * @type {import('@supabase/supabase-js').SupabaseClient}
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: { 'x-application-name': 'aleocrophic-payments' },
  },
});

/**
 * Helper untuk menangani error dari Supabase secara konsisten.
 * Melakukan logging dan kategorisasi error untuk mempermudah debugging dan handling di UI.
 * 
 * @param {object} error - Objek error yang dikembalikan oleh Supabase Client.
 * @param {string} [context='Database Operation'] - Deskripsi singkat di mana error terjadi.
 * @returns {object} Objek error yang telah diformat dan dikategorikan.
 */
export const handleSupabaseError = (error, context = 'Database Operation') => {
  if (!error) return null;

  const errorDetails = {
    context,
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
    timestamp: new Date().toISOString()
  };

  // Kategorisasi Error
  let category = 'UNKNOWN_ERROR';
  if (error.code?.startsWith('23')) category = 'DATABASE_CONSTRAINT_ERROR';
  else if (error.code?.startsWith('42')) category = 'DATABASE_PERMISSION_ERROR';
  else if (error.code === 'PGRST116') category = 'NOT_FOUND_ERROR';
  else if (error.message?.includes('network')) category = 'NETWORK_ERROR';
  else if (error.status === 401 || error.status === 403) category = 'AUTHENTICATION_ERROR';

  console.error(`[SUPABASE_ERROR] [${category}] ${context}:`, errorDetails);

  return {
    ...errorDetails,
    category,
    isRecoverable: category === 'NETWORK_ERROR' || error.status === 503
  };
};
