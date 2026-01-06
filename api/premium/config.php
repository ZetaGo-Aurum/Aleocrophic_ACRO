<?php
// api/premium/config.php

return [
    'auto_approve' => [
        'emails' => [
            'deltaastra24@gmail.com',
            'admin@aleocrophic.com',
        ],
        'domains' => [
            'aleocrophic.com'
        ]
    ],
    'default_tier' => 'ULTIMATE',
    'trakteer_token' => getenv('TRAKTEER_TOKEN') ?: 'trhook-nZcr7Rquyhir9iiFDpVuWfoF',
    'logging' => [
        'enabled' => true,
        'path' => __DIR__ . '/logs/app.log'
    ]
];
