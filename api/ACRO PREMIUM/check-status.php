<?php
// check-status.php - API endpoint to check license status
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method Not Allowed']);
    exit;
}

$email = strtolower($_REQUEST['email'] ?? '');

if (empty($email)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Email is required']);
    exit;
}

try {
    $pdo = getDbConnection();
    
    // Ambil semua license untuk email tersebut, urutkan dari yang terbaru
    $stmt = $pdo->prepare("SELECT supporter_name, tier, license_key, created_at FROM orders WHERE supporter_email = ? ORDER BY created_at DESC");
    $stmt->execute([$email]);
    $results = $stmt->fetchAll();

    if (count($results) > 0) {
        // Return the latest license as the main data object to match frontend expectation
        // We could also return all history in a separate field if needed
        echo json_encode([
            'status' => 'success',
            'data' => $results[0], // Ambil yang paling baru
            'history' => $results // Opsional: kirim history lengkap
        ]);
    } else {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => 'No license found for this email. If you just paid, please wait a moment for processing.'
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
