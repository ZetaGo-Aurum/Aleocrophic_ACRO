<?php
// tests/test_webhook.php
$url = 'http://localhost/api/premium/webhook.php'; // Change this to your local dev URL if needed
$token = 'trhook-nZcr7Rquyhir9iiFDpVuWfoF';
$payload = json_encode([
    'supporter_name' => 'Test User',
    'supporter_email' => 'test@example.com',
    'quantity' => 1,
    'price' => 62500,
    'message' => 'Test payment'
]);

$signature = hash_hmac('sha256', $payload, $token);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-Trakteer-Hash: ' . $signature
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status: $httpCode\n";
echo "Response: $response\n";
