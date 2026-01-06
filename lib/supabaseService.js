import { supabase, handleSupabaseError } from './supabaseClient';

/**
 * Service Layer untuk Operasi Database Aleocrophic Payments.
 * Mengabstraksi panggilan ke Supabase dan menyediakan penanganan error yang konsisten.
 */
export const supabaseService = {
  
  /**
   * Mengambil data lisensi berdasarkan email pendukung.
   * 
   * @param {string} email - Alamat email yang digunakan saat pembayaran.
   * @returns {Promise<{data: Array|null, error: object|null}>} Hasil query dan objek error jika ada.
   */
  async getOrdersByEmail(email) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('supporter_email', email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: handleSupabaseError(err, 'getOrdersByEmail') };
    }
  },

  /**
   * Menambahkan data pesanan baru yang diterima dari Webhook Trakteer.
   * 
   * @param {object} orderData - Objek data pesanan lengkap.
   * @param {string} orderData.supporter_name - Nama pendukung.
   * @param {string} orderData.supporter_email - Email pendukung.
   * @param {string} orderData.tier - Nama tier pembayaran.
   * @param {string} orderData.license_key - Lisensi yang dihasilkan.
   * @returns {Promise<{data: object|null, error: object|null}>} Hasil insert.
   */
  async createOrder(orderData) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: handleSupabaseError(err, 'createOrder') };
    }
  },

  /**
   * Mengambil data profil premium pengguna berdasarkan username.
   * 
   * @param {string} username - Username pengguna di Aleocrophic.
   * @returns {Promise<{data: object|null, error: object|null}>} Data premium pengguna.
   */
  async getPremiumData(username) {
    try {
      const { data, error } = await supabase
        .from('premium')
        .select('*')
        .eq('username', username)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: handleSupabaseError(err, 'getPremiumData') };
    }
  },

  /**
   * Memperbarui lisensi premium untuk pengguna tertentu.
   * 
   * @param {number|string} id_premium - ID unik baris di tabel premium.
   * @param {object} licenseData - Objek JSON lisensi baru.
   * @returns {Promise<{data: object|null, error: object|null}>} Hasil pembaruan.
   */
  async updatePremiumLicense(id_premium, licenseData) {
    try {
      const { data, error } = await supabase
        .from('premium')
        .update({ premium_license: licenseData })
        .eq('id_premium', id_premium)
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: handleSupabaseError(err, 'updatePremiumLicense') };
    }
  },

  /**
   * Mencatat log error ke tabel database 'error_logs'.
   * 
   * @param {string} errorType - Kategori error (e.g., 'AUTH', 'TRAKTEER').
   * @param {string} message - Pesan error singkat.
   * @param {object} details - Objek JSON berisi detail teknis error.
   * @returns {Promise<void>}
   */
  async logError(errorType, message, details) {
    try {
      await supabase.from('error_logs').insert([{
        error_type: errorType,
        message: message,
        details: details
      }]);
    } catch (err) {
      console.error('Failed to log error to database:', err);
    }
  }
};
