<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\HandleCors;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // CORS for SPA
        $middleware->append(HandleCors::class);

        // keep Laravel's default web middleware group (sessions, cookies, CSRF, etc.)
        // (don't override it unless you really mean to)
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // keep this - it registers the ExceptionHandler binding
    })
    ->withMiddleware(function ($middleware) {
        $middleware->append(\App\Http\Middleware\ForcePasswordChange::class);
    })

    ->create();
