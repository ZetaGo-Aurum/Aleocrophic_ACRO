# Test Case & Hasil Testing

Dokumen ini merinci skenario pengujian untuk sistem pembayaran Aleocrophic.

## 1. Unit Testing: Generation Key
- **Input:** Tier `ULTIMATE`
- **Expected:** Key diawali `ACRO-ULT-` diikuti 8 karakter hex, dash, dan 4 karakter hex.
- **Result:** PASSED

- **Input:** Tier `PRO_PLUS`
- **Expected:** Key diawali `ACRO-PP-` diikuti 8 karakter hex, dash, dan 4 karakter hex.
- **Result:** PASSED

## 2. Integration Testing: Webhook (Simulasi Trakteer)

### Case A: Pembayaran Valid (Ultimate)
- **Payload:** `{ quantity: 2, price: 62500, email: "user@example.com" }`
- **Expected:** HTTP 200, Tier `ULTIMATE`, License Key tersimpan di DB.
- **Result:** PASSED

### Case B: Pembayaran Valid (Pro+)
- **Payload:** `{ quantity: 1, price: 62500, email: "user@example.com" }`
- **Expected:** HTTP 200, Tier `PRO_PLUS`, License Key tersimpan di DB.
- **Result:** PASSED

### Case C: Signature Tidak Valid
- **Header:** `X-Trakteer-Hash` salah
- **Expected:** HTTP 401 Unauthorized.
- **Result:** PASSED

## 3. Frontend Testing: Claim Key

### Case A: Email Terdaftar
- **Action:** Klik "Cek Status", masukkan email yang sudah membayar.
- **Expected:** Muncul SweetAlert sukses dengan License Key yang benar.
- **Result:** PASSED

### Case B: Email Tidak Terdaftar
- **Action:** Masukkan email random.
- **Expected:** Muncul SweetAlert error "No license found".
- **Result:** PASSED

### Case C: Multiple Licenses
- **Action:** Masukkan email yang memiliki lebih dari satu transaksi.
- **Expected:** Muncul list license yang bisa dipilih/disalin.
- **Result:** PASSED

## 4. Cross-Platform & Browser Compatibility
- **Desktop:** Chrome, Firefox, Edge, Safari (PASSED)
- **Mobile:** Android Chrome, iOS Safari (PASSED)
- **Responsive:** Tailwind CSS memastikan layout tetap rapi di semua ukuran layar.
