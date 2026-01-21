<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | This file controls the CORS settings for your application.
    | Required for SPA (React / Vue / Vite) + Laravel sessions.
    |
    */

    'paths' => [
        'api/*',
        'login',
        'logout',
        'privacy/*',
        'sanctum/csrf-cookie',
    ],

    'allowed_methods' => ['*'],

    // IMPORTANT: must NOT be '*'
    'allowed_origins' => [
        'http://localhost:5173',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // REQUIRED for cookies / sessions
    'supports_credentials' => true,
];
