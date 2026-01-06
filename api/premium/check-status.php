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
$config = require 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method Not Allowed']);
    exit;
}

$email = strtolower(trim($_REQUEST['email'] ?? ''));

if (empty($email)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Email is required']);
    exit;
}

try {
    $pdo = getDbConnection();
    
    // Check if user is in auto-approve list
    $isAutoApprove = in_array($email, $config['auto_approve']['emails']);
    foreach ($config['auto_approve']['domains'] as $domain) {
        if (strpos($email, '@' . $domain) !== false) {
            $isAutoApprove = true;
            break;
        }
    }

    // Ambil semua license untuk email tersebut, urutkan dari yang terbaru
    $stmt = $pdo->prepare("SELECT supporter_name, tier, license_key, created_at FROM orders WHERE supporter_email = ? ORDER BY created_at DESC");
    $stmt->execute([$email]);
    $results = $stmt->fetchAll();

    if (count($results) > 0) {
        echo json_encode([
            'status' => 'success',
            'data' => $results[0],
            'history' => $results
        ]);
        exit;
    } 
    
    // If not found in DB but is in auto-approve list, generate and save key now
    if ($isAutoApprove) {
        $tier = $config['default_tier'];
        $licenseKey = generateLicenseKey($tier);
        $supporterName = 'Auto-Approved Account';
        
        $insertStmt = $pdo->prepare("INSERT INTO orders (supporter_name, supporter_email, quantity, total_amount, tier, license_key) VALUES (?, ?, ?, ?, ?, ?)");
        $insertStmt->execute([$supporterName, $email, 1, 0, $tier, $licenseKey]);
        
        echo json_encode([
            'status' => 'success',
            'message' => 'License automatically generated for your account.',
            'data' => [
                'supporter_name' => $supporterName,
                'tier' => $tier,
                'license_key' => $licenseKey,
                'created_at' => date('Y-m-d H:i:s')
            ]
        ]);
        exit;
    }

    // No license found and not auto-approved
    http_response_code(404);
    echo json_encode([
        'status' => 'error',
        'message' => 'No license found for this email. If you just paid, please wait a moment for processing.'
    ]);

} catch (Exception $e) {
    // Log the error if enabled
    if ($config['logging']['enabled']) {
        $logDir = dirname($config['logging']['path']);
        if (!is_dir($logDir)) mkdir($logDir, 0777, true);
        error_log("[" . date('Y-m-d H:i:s') . "] Error in check-status.php: " . $e->getMessage() . "\n", 3, $config['logging']['path']);
    }

    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Server Error: ' . $e->getMessage()]);
}
?>
