<?php
// Set header agar response berupa JSON
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Trakteer-Hash');
header('Content-Type: application/json');

// Handle Preflight Request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

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
$config = require 'config.php';

// --- KONFIGURASI ---
$TRAKTEER_TOKEN = $config['trakteer_token'];

// --- LOGIKA UTAMA ---

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error', 
        'message' => 'Method Not Allowed. This endpoint only accepts POST requests from Trakteer.'
    ]);
    exit;
}

$input = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_TRAKTEER_HASH'] ?? '';

// Verifikasi Signature (Hanya jika token dikonfigurasi dan bukan placeholder)
if ($TRAKTEER_TOKEN && $TRAKTEER_TOKEN !== 'your_token_here') {
    // Note: Trakteer documentation might specify how to verify signature. 
    // Assuming standard HMAC SHA256 logic here if they provide X-Trakteer-Hash.
    // If not provided by Trakteer, this block might be skipped or adjusted.
    if (!empty($signature)) {
        $expectedSignature = hash_hmac('sha256', $input, $TRAKTEER_TOKEN);
        if (!hash_equals($expectedSignature, $signature)) {
            http_response_code(401);
            echo json_encode(['status' => 'error', 'message' => 'Invalid signature']);
            exit;
        }
    }
}

$data = json_decode($input, true);

if (!$data) {
    // Fallback to $_POST if JSON decode fails (e.g. form-data)
    $data = $_POST;
}

// Log input for debugging (optional, remove in production if sensitive)
// error_log("Webhook Input: " . print_r($data, true));

try {
    $supporterName = $data['supporter_name'] ?? 'Unknown';
    $supporterEmail = isset($data['supporter_email']) ? strtolower(trim($data['supporter_email'])) : '';
    
    // Trakteer payload variation check
    // Sometimes Trakteer sends 'email' instead of 'supporter_email' depending on webhook version
    if (empty($supporterEmail) && isset($data['email'])) {
        $supporterEmail = strtolower(trim($data['email']));
    }
    
    if (empty($supporterEmail)) {
        // Check if it's a test webhook from Trakteer
        $isTest = isset($data['test']) && $data['test'] == true;
        
        if ($isTest) {
            error_log("[WEBHOOK_TEST] Trakteer Test Webhook received successfully.");
            http_response_code(200);
            echo json_encode([
                'status' => 'success',
                'message' => 'Test webhook received successfully. No license generated because email is missing.'
            ]);
            exit;
        }

        // Log the 403-like permission/auth error details for analysis
        $traceId = 'sin1::' . bin2hex(random_bytes(8)) . '-' . time();
        error_log("[AUTH_ERROR] 403 Forbidden - Missing Supporter Email. Trace ID: $traceId. Payload: " . json_encode($data));
        
        // Return 403 Forbidden to signal permission/auth issue back to Trakteer
        http_response_code(403); 
        echo json_encode([
            'status' => 'error', 
            'message' => 'Forbidden: Supporter email is required for license generation.',
            'trace_id' => $traceId
        ]);
        exit;
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
        // Donation too small, just acknowledge
        echo json_encode(['status' => 'success', 'message' => 'Donation received but below 1 ACRON (62.5k).']);
        exit;
    }

    // Generate License Key
    $licenseKey = generateLicenseKey($tier);

    // Simpan ke Database
    $pdo = getDbConnection();
    
    // Cek duplikat email? 
    // Usually supporters can buy multiple times. So we just insert new order.
    // Or we might want to update existing user? 
    // For now, let's insert a new record for every valid donation.
    
    $stmt = $pdo->prepare("INSERT INTO orders (supporter_name, supporter_email, quantity, total_amount, tier, license_key) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$supporterName, $supporterEmail, $quantity, $totalAmount, $tier, $licenseKey]);

    echo json_encode([
        'status' => 'success',
        'message' => $statusMessage,
        'data' => [
            'tier' => $tier,
            'license_key' => $licenseKey
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
