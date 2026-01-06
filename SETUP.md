# Setup & Konfigurasi Aleocrophic Payments

Proyek ini telah dikonfigurasi untuk bekerja secara nyata dengan integrasi Trakteer Webhook dan Database PostgreSQL.

## 1. Persyaratan Sistem
- Akun [Trakteer](https://trakteer.id) (untuk Webhook)
- Database PostgreSQL (Disarankan menggunakan [Supabase](https://supabase.com))
- Akun [Vercel](https://vercel.com) (Direkomendasikan untuk deployment PHP)
- **Node.js**: Versi 20.x atau lebih baru (diperlukan untuk environment deployment Vercel)
- **Vercel PHP Runtime**: `vercel-php@0.7.4` (atau lebih baru)

## 2. Struktur Database
Jalankan query SQL berikut di database PostgreSQL Anda untuk membuat tabel yang diperlukan:

```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    supporter_name VARCHAR(255),
    supporter_email VARCHAR(255) NOT NULL,
    quantity INTEGER,
    total_amount INTEGER,
    tier VARCHAR(50),
    license_key VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email ON orders(supporter_email);
```

## 3. Variabel Lingkungan (Environment Variables)
Konfigurasikan variabel berikut di platform deployment Anda (Vercel/Netlify):

| Variabel | Deskripsi | Contoh |
|----------|-----------|---------|
| `TRAKTEER_TOKEN` | Token Webhook dari Trakteer | `trhook-xxx...` |
| `DB_HOST` | Host database PostgreSQL | `db.xxx.supabase.co` |
| `DB_PORT` | Port database (default 5432) | `5432` |
| `DB_NAME` | Nama database | `postgres` |
| `DB_USER` | Username database | `postgres` |
| `DB_PASSWORD` | Password database | `your-password` |

## 4. Deployment

### Vercel (Direkomendasikan)
1. Hubungkan repositori ke Vercel.
2. Vercel akan secara otomatis mendeteksi `vercel.json` dan menggunakan runtime `vercel-php`.
   - **Penting:** Pastikan di Project Settings > General > Node.js Version diset ke **20.x** atau **22.x**.
3. Masukkan Environment Variables di dashboard Vercel.
4. Deploy.

### Netlify
1. Hubungkan repositori ke Netlify.
2. Netlify akan menggunakan `netlify.toml`.
3. **Catatan:** Untuk menjalankan PHP di Netlify, Anda mungkin perlu menambahkan Build Plugin seperti `netlify-plugin-php` atau menggunakan setup Docker. Vercel jauh lebih mudah untuk proyek PHP murni ini.

## 5. Integrasi Trakteer
1. Masuk ke dashboard Trakteer.
2. Buka menu **Integrasi > Webhook**.
3. Masukkan URL Webhook: `https://your-domain.com/api/ACRO%20PREMIUM/webhook.php` (atau `https://your-domain.com/webhook`).
4. Salin **Key/Token** dan masukkan ke variabel lingkungan `TRAKTEER_TOKEN`.

## 6. Testing & Validasi
Sebelum melakukan deployment, Anda dapat memvalidasi konfigurasi proyek menggunakan script yang tersedia:

```bash
# Validasi konfigurasi vercel.json
npm run test:config
```

Anda juga dapat melakukan test webhook menggunakan `curl`:

```bash
curl -X POST https://your-domain.com/api/ACRO%20PREMIUM/webhook.php \
-H "Content-Type: application/json" \
-H "X-Trakteer-Hash: YOUR_HMAC_HERE" \
-d '{
  "supporter_name": "Test User",
  "supporter_email": "test@example.com",
  "quantity": 2,
  "price": 62500,
  "message": "Mau Ultimate dong!"
}'
```
