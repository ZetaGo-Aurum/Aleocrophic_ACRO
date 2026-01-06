import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseServiceKey) {
  throw new Error('Missing SUPABASE_SECRET_KEY. This should only be used in server-side environments.');
}

/**
 * Supabase Admin Client.
 * Digunakan secara eksklusif di sisi server untuk melakukan operasi yang memerlukan bypass Row Level Security (RLS).
 * 
 * PERINGATAN KEAMANAN: Objek ini menggunakan Service Role Key. Jangan pernah mengimpor atau menggunakan file ini 
 * di komponen sisi client karena akan mengekspos kunci rahasia admin.
 * 
 * @type {import('@supabase/supabase-js').SupabaseClient}
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
