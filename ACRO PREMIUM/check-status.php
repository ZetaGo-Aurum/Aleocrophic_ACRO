<?php
// check-status.php - API endpoint to check license status
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
    
    // Ambil semua license untuk email tersebut
    $stmt = $pdo->prepare("SELECT supporter_name, tier, license_key, created_at FROM orders WHERE supporter_email = ? ORDER BY created_at DESC");
    $stmt->execute([$email]);
    $results = $stmt->fetchAll();

    if (count($results) > 0) {
        echo json_encode([
            'status' => 'success',
            'data' => $results
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
