-- Aleocrophic Payments - Supabase Database Schema

-- 1. Tabel Orders (Dari SETUP.md)
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    supporter_name VARCHAR(255),
    supporter_email VARCHAR(255) NOT NULL,
    quantity INTEGER,
    total_amount INTEGER,
    tier VARCHAR(50),
    license_key VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk performa pencarian email
CREATE INDEX IF NOT EXISTS idx_email ON orders(supporter_email);

-- 2. Tabel Premium (Dari Referensi Gambar User)
CREATE TABLE IF NOT EXISTS premium (
    id_premium BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    premium_license JSONB,
    username VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Keamanan: Row Level Security (RLS)
-- Aktifkan RLS pada tabel
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium ENABLE ROW LEVEL SECURITY;

-- Kebijakan: Hanya Service Role atau User Terautentikasi (Admin) yang bisa melihat semua data
CREATE POLICY "Allow authenticated read access" ON orders
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public insert for webhooks" ON orders
    FOR INSERT WITH CHECK (true); -- Webhook Trakteer butuh akses insert tanpa auth user

-- Kebijakan untuk tabel premium
CREATE POLICY "Allow authenticated read access for premium" ON premium
    FOR SELECT USING (auth.role() = 'authenticated');

-- 4. Real-time Subscriptions
-- Aktifkan real-time untuk monitoring transaksi baru
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE premium;

-- 5. Error Logging Table (Opsional untuk Monitoring)
CREATE TABLE IF NOT EXISTS error_logs (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    error_type VARCHAR(50),
    message TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
