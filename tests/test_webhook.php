<?php
/**
 * Test script for Trakteer Webhook
 * Usage: php tests/test_webhook.php
 */

$webhookUrl = 'http://localhost:8000/api/premium/webhook.php'; // Change to your local or remote URL
$token = 'your_token_here'; // Must match TRAKTEER_TOKEN in config.php

// Scenario 1: Valid Webhook
$payload1 = [
    'supporter_name' => 'John Doe',
    'supporter_email' => 'john@example.com',
    'quantity' => 1,
    'price' => 62500,
    'order_id' => 'TRK-' . strtoupper(bin2hex(random_bytes(4)))
];

// Scenario 2: Test Webhook (Missing email)
$payload2 = [
    'test' => true,
    'supporter_name' => 'Trakteer Tester'
];

// Scenario 3: Missing Email (Invalid)
$payload3 = [
    'supporter_name' => 'Anonymous'
];

function sendWebhook($url, $payload, $token) {
    $jsonPayload = json_encode($payload);
    $signature = hash_hmac('sha256', $jsonPayload, $token);
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonPayload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'X-Trakteer-Hash: ' . $signature
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "Payload: " . json_encode($payload) . "\n";
    echo "HTTP Code: $httpCode\n";
    echo "Response: $response\n";
    echo "-----------------------------------\n";
}

echo "Testing Trakteer Webhook Implementation...\n\n";

echo "Scenario 1: Valid Webhook\n";
sendWebhook($webhookUrl, $payload1, $token);

echo "Scenario 2: Test Webhook (Missing email, should return 200)\n";
sendWebhook($webhookUrl, $payload2, $token);

echo "Scenario 3: Missing Email (Should return 403)\n";
sendWebhook($webhookUrl, $payload3, $token);
