<?php
// Set header agar response berupa JSON
header('Content-Type: application/json');

// Global error handler to ensure JSON response
set_exception_handler(function ($e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Internal Server Error: ' . $e->getMessage()
    ]);
    exit;
});

set_error_handler(function ($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) return;
    throw new ErrorException($message, 0, $severity, $file, $line);
});

require_once 'db.php';

// --- KONFIGURASI ---
$TRAKTEER_TOKEN = getenv('TRAKTEER_TOKEN') ?: 'trhook-nZcr7Rquyhir9iiFDpVuWfoF'; 

// --- FUNGSI GENERATE KEY ---
function generateLicenseKey($tier) {
    // Format: ACRO-[TIER]-[8 chars]-[4 chars]
    $prefix = ($tier === 'ULTIMATE') ? 'ACRO-ULT-' : 'ACRO-PP-';
    
    try {
        $bytes1 = random_bytes(4); // 8 hex characters
        $bytes2 = random_bytes(2); // 4 hex characters
    } catch (Exception $e) {
        $bytes1 = openssl_random_pseudo_bytes(4);
        $bytes2 = openssl_random_pseudo_bytes(2);
    }
    
    $part1 = strtoupper(bin2hex($bytes1));
    $part2 = strtoupper(bin2hex($bytes2));
    
    return $prefix . $part1 . '-' . $part2;
}

// --- LOGIKA UTAMA ---

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method Not Allowed']);
    exit;
}

$input = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_TRAKTEER_HASH'] ?? '';

// Verifikasi Signature (Hanya jika token dikonfigurasi)
if ($TRAKTEER_TOKEN && $TRAKTEER_TOKEN !== 'your_token_here') {
    $expectedSignature = hash_hmac('sha256', $input, $TRAKTEER_TOKEN);
    if (!hash_equals($expectedSignature, $signature)) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Invalid signature']);
        exit;
    }
}

$data = json_decode($input, true);

if (!$data) {
    $data = $_POST;
}

try {
    $supporterName = $data['supporter_name'] ?? 'Unknown';
    $supporterEmail = strtolower($data['supporter_email'] ?? '');
    
    if (empty($supporterEmail)) {
        throw new Exception("Supporter email is required.");
    }

    $quantity = intval($data['quantity'] ?? 1); // Jumlah UNIT ACRON
    $price = intval($data['price'] ?? 62500); // Harga per unit ACRON
    $totalAmount = $quantity * $price; // Total Rupiah
    $message = strtolower($data['message'] ?? ''); // Pesan dari supporter

    $tier = 'UNKNOWN';
    $statusMessage = 'License generated successfully';
    
    // Logika Ultimate: Minimal Rp 125.000 (2 ACRON)
    if ($totalAmount >= 125000) {
        $tier = 'ULTIMATE';
    } 
    // Logika Pro+: Minimal Rp 62.500 (1 ACRON)
    elseif ($totalAmount >= 62500) {
        $tier = 'PRO_PLUS';
        $statusMessage = 'PRO+ License Generated.';
    } 
    else {
        echo json_encode(['status' => 'success', 'message' => 'Donation received but below 1 ACRON (62.5k).']);
        exit;
    }

    // Generate Key
    $licenseKey = generateLicenseKey($tier);

    // Simpan ke Database
    $pdo = getDbConnection();
    
    // Cek apakah email sudah punya license (opsional, tergantung kebijakan)
    $stmt = $pdo->prepare("SELECT license_key FROM orders WHERE supporter_email = ? AND tier = ?");
    $stmt->execute([$supporterEmail, $tier]);
    $existing = $stmt->fetch();

    if ($existing) {
        $licenseKey = $existing['license_key'];
        $statusMessage = "Existing license retrieved.";
    } else {
        $stmt = $pdo->prepare("INSERT INTO orders (supporter_name, supporter_email, quantity, total_amount, tier, license_key) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$supporterName, $supporterEmail, $quantity, $totalAmount, $tier, $licenseKey]);
    }

    // Logging
    error_log("ORDER: $supporterName | Email: $supporterEmail | Paid: $totalAmount | Tier: $tier | Key: $licenseKey");

    // Response JSON
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'data' => [
            'supporter' => $supporterName,
            'tier' => $tier,
            'acron_units' => $quantity,
            'license_key' => $licenseKey, 
            'message' => $statusMessage
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
