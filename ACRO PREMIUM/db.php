<?php
// db.php - Database connection using PDO

// Ensure no errors are displayed as HTML
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

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
