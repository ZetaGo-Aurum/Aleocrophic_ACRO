<?php
// tests/ValidationTest.php

require_once __DIR__ . '/../api/premium/db.php';
$config = require __DIR__ . '/../api/premium/config.php';

function testLicenseGeneration() {
    echo "Testing License Generation...\n";
    $ultimateKey = generateLicenseKey('ULTIMATE');
    $proPlusKey = generateLicenseKey('PRO_PLUS');
    
    if (strpos($ultimateKey, 'ACRO-ULT-') === 0) {
        echo "[PASS] Ultimate Key format correct: $ultimateKey\n";
    } else {
        echo "[FAIL] Ultimate Key format incorrect: $ultimateKey\n";
    }
    
    if (strpos($proPlusKey, 'ACRO-PP-') === 0) {
        echo "[PASS] Pro+ Key format correct: $proPlusKey\n";
    } else {
        echo "[FAIL] Pro+ Key format incorrect: $proPlusKey\n";
    }
}

function testAutoApproveCriteria($config) {
    echo "\nTesting Auto-Approve Criteria...\n";
    $testEmails = [
        'deltaastra24@gmail.com' => true,
        'test@aleocrophic.com' => true,
        'user@gmail.com' => false
    ];
    
    foreach ($testEmails as $email => $expected) {
        $isAutoApprove = in_array($email, $config['auto_approve']['emails']);
        if (!$isAutoApprove) {
            foreach ($config['auto_approve']['domains'] as $domain) {
                if (strpos($email, '@' . $domain) !== false) {
                    $isAutoApprove = true;
                    break;
                }
            }
        }
        
        if ($isAutoApprove === $expected) {
            echo "[PASS] $email correctly identified as " . ($expected ? 'VIP' : 'Normal') . "\n";
        } else {
            echo "[FAIL] $email incorrectly identified as " . ($isAutoApprove ? 'VIP' : 'Normal') . "\n";
        }
    }
}

// Run tests
testLicenseGeneration();
testAutoApproveCriteria($config);
