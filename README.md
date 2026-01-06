# 💳 Aleocrophic Payments - ACRO PREMIUM

[![Vercel Deployment](https://img.shields.io/badge/Deployment-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![PHP Version](https://img.shields.io/badge/PHP-8.2-777bb4?style=for-the-badge&logo=php)](https://www.php.net/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

Sistem manajemen pembayaran dan lisensi otomatis untuk ekosistem **Aleocrophic**, yang terintegrasi langsung dengan Trakteer Webhook dan Database PostgreSQL.

---

## 🚀 Pengenalan Proyek

**Aleocrophic Payments** adalah solusi gateway pembayaran kustom yang dirancang untuk mengotomatiskan distribusi license key produk digital. Proyek ini berfungsi sebagai jembatan antara platform donasi (Trakteer) dan pengguna akhir, memastikan setiap transaksi divalidasi dan diproses secara real-time.

### 🛠️ Teknologi Utama
- **Backend:** PHP 8.2 dengan PDO (PostgreSQL)
- **Frontend:** HTML5, Tailwind CSS (Modern Glassmorphism)
- **Database:** PostgreSQL (Optimized for Supabase)
- **Integrasi:** Trakteer Webhook API (HMAC-SHA256 Verification)
- **UI Components:** SweetAlert2, Lucide Icons

### 🎯 Target Pengguna
- Pengguna **Modded Ubuntu (ACRO PRO Edition)**.
- Developer yang ingin mengimplementasikan sistem lisensi berbasis webhook.
- Konten kreator yang menggunakan Trakteer sebagai platform monetisasi.

---

## 📖 Dokumentasi Lengkap

### 1. Persyaratan Sistem
- Web Server (Apache/Nginx) dengan dukungan PHP 8.x.
- Database PostgreSQL.
- Ekstensi PHP: `pdo_pgsql`, `openssl`.
- SSL Certificate (Wajib untuk Webhook Trakteer).

### 2. Panduan Instalasi & Konfigurasi

#### Langkah A: Setup Database
Jalankan skema SQL berikut untuk menyiapkan tabel transaksi:
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

#### Langkah B: Variabel Lingkungan
Buat file `.env` atau atur Environment Variables di dashboard deployment:
```env
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
TRAKTEER_TOKEN=trhook-xxxxxx
```

#### Langkah C: Deployment
Proyek ini mendukung deployment instan di:
- **Vercel:** Menggunakan `vercel.json` dan runtime `vercel-php`.
- **Netlify:** Menggunakan `netlify.toml` (diperlukan konfigurasi PHP tambahan).

### 3. Struktur Direktori
```text
.
├── ACRO PREMIUM/
│   ├── index.html        # Landing page & UI Claim Key
│   ├── db.php            # Koneksi Database & Business Logic
│   ├── webhook.php       # Endpoint penerima data Trakteer
│   └── check-status.php  # API untuk pengecekan lisensi
├── vercel.json           # Konfigurasi Vercel
├── netlify.toml          # Konfigurasi Netlify
├── SETUP.md              # Panduan teknis mendalam
└── TESTING.md            # Laporan hasil pengujian
```

---

## 🛠️ Cara Penggunaan Dasar

1. **Pembayaran:** Pengguna melakukan pembayaran melalui Trakteer.
2. **Otomasi:** Webhook menerima data, memvalidasi tier, dan membuat license key unik.
3. **Claim:** Pengguna membuka landing page, memasukkan email, dan mendapatkan license key mereka secara instan.
4. **Validasi:** Key dapat digunakan langsung pada produk ACRO terkait.

---

## 🔗 Link Landing ke Repositori Utama

Proyek ini merupakan bagian dari ekosistem besar **Modded Ubuntu**. Untuk mendapatkan distribusi Linux premium untuk Termux, kunjungi repositori utama kami:

<p align="center">
  <a href="https://github.com/ZetaGo-Aurum/modded-ubuntu">
    <img src="https://img.shields.io/badge/VISIT_MAIN_REPO-MODDED_UBUNTU-blueviolet?style=for-the-badge&logo=github" alt="Visit Main Repo">
  </a>
</p>

> **ACRO PRO Edition:** Ubuntu 25.10 | 1000+ Pre-Installed Software | GPU Optimized.

---

## 🤝 Kontribusi & Lisensi

Kami menerima kontribusi dalam bentuk Issue Report maupun Pull Request. Silakan lihat `CONTRIBUTING.md` (jika tersedia) untuk panduan lebih lanjut.

- **Lisensi:** Didistribusikan di bawah [MIT License](LICENSE).
- **Update Terakhir:** 06 Januari 2026
- **Versi:** v1.0.2-stable

---
<p align="center">Made with ❤️ by Aleocrophic Team</p>
