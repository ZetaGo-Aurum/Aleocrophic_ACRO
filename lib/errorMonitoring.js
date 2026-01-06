import { supabaseService } from './supabaseService';

/**
 * Utilitas Monitoring Error Trakteer & Database.
 * Menyediakan fungsi untuk pelacakan error, mekanisme retry, dan kategorisasi error API.
 */
export const errorMonitoring = {
  
  /**
   * Melacak error, melakukan logging ke konsol, dan menyimpannya ke database audit.
   * 
   * @param {Error|object} error - Objek error yang ditangkap.
   * @param {string} [type='GENERAL'] - Jenis error (e.g., 'AUTH', 'DB', 'NETWORK', 'TRAKTEER').
   * @returns {Promise<void>}
   */
  async trackError(error, type = 'GENERAL') {
    const errorData = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      type: type,
      timestamp: new Date().toISOString(),
      metadata: error.metadata || {}
    };

    console.error(`[ERROR_TRACKING] [${type}]`, errorData);

    // Kirim ke database untuk audit trail
    await supabaseService.logError(type, errorData.message, errorData);
  },

  /**
   * Mekanisme Retry dengan Exponential Backoff untuk fungsi async yang bisa gagal karena masalah jaringan.
   * 
   * @param {Function} fn - Fungsi async yang akan dijalankan kembali jika gagal.
   * @param {number} [retries=3] - Jumlah maksimal percobaan ulang.
   * @param {number} [delay=1000] - Jeda awal antar percobaan dalam milidetik.
   * @returns {Promise<any>} Hasil dari fungsi yang dijalankan.
   * @throws {Error} Error terakhir jika semua percobaan gagal.
   */
  async withRetry(fn, retries = 3, delay = 1000) {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) throw error;
      
      console.warn(`[RETRY] Attempt failed. Retries left: ${retries}. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this.withRetry(fn, retries - 1, delay * 2); // Exponential backoff
    }
  },

  /**
   * Mengategorikan error berdasarkan kode status HTTP dari respons Trakteer.
   * 
   * @param {Response|object} response - Objek respons dari fetch atau API call.
   * @returns {string} Kategori error yang sesuai.
   */
  categorizeTrakteerError(response) {
    if (response.status === 401) return 'AUTH_ERROR';
    if (response.status === 403) return 'FORBIDDEN_ERROR';
    if (response.status >= 500) return 'SERVER_ERROR';
    return 'UNKNOWN_TRAKTEER_ERROR';
  }
};
