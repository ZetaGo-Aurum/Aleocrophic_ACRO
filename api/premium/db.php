<?php
// db.php - Database connection using PDO

// Ensure no errors are displayed as HTML
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

// Simple .env loader
function loadEnv($path) {
    if (!file_exists($path)) {
        return false;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);

        if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
    return true;
}

// Load environment variables from root
loadEnv(__DIR__ . '/../../.env');

function getDbConnection() {
    $host = getenv('DB_HOST');
    $port = getenv('DB_PORT') ?: '5432';
    $dbname = getenv('DB_NAME');
    $user = getenv('DB_USER');
    $pass = getenv('DB_PASSWORD');

    if (!$host || !$dbname || !$user || !$pass) {
        throw new Exception("Database configuration missing in environment variables.");
    }

    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname;sslmode=require";
    
    try {
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        return $pdo;
    } catch (PDOException $e) {
        throw new Exception("Database connection failed: " . $e->getMessage());
    }
}

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

function initDatabase() {
    $pdo = getDbConnection();
    $sql = "
    CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        supporter_name VARCHAR(255),
        supporter_email VARCHAR(255) NOT NULL,
        quantity INTEGER,
        total_amount INTEGER,
        tier VARCHAR(50),
        license_key VARCHAR(100) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_email ON orders(supporter_email);
    ";
    $pdo->exec($sql);
}
?>
