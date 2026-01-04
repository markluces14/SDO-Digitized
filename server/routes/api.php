<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\LookupController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\UserController;

Route::get('/health', fn() => ['ok' => true, 'time' => now()]);
Route::get('/ping', fn() => ['pong' => true]);

// Auth (public)
Route::post('/login', [AuthController::class, 'login']);

// If you want view/download available even when logged out, move these two
// routes up here (outside Sanctum group). Otherwise leave them inside.
Route::middleware('auth:sanctum')->group(function () {
    // Session
    Route::get('/me',     [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Users
    Route::get('users',           [\App\Http\Controllers\UserController::class, 'index']);
    Route::post('users',          [\App\Http\Controllers\UserController::class, 'store']);
    Route::put('users/{user}',    [\App\Http\Controllers\UserController::class, 'update']);
    Route::patch('users/{user}/password', [\App\Http\Controllers\UserController::class, 'resetPassword']);
    Route::patch('users/{user}/toggle',   [\App\Http\Controllers\UserController::class, 'toggleActive']);
    Route::delete('users/{user}', [\App\Http\Controllers\UserController::class, 'destroy']);


    // Employees (index, show, store, update, destroy)
    Route::apiResource('employees', EmployeeController::class);

    // Lookups
    Route::get('/document-types', [LookupController::class, 'documentTypes']);
    Route::get('/tags',           [LookupController::class, 'tags']);

    // Documents
    Route::get('/employees/{employee}/documents', [DocumentController::class, 'byEmployee']);
    Route::post('/documents',                     [DocumentController::class, 'store']);
    Route::get('/documents/{document}/view',      [DocumentController::class, 'view']);
    Route::get('/documents/{document}/download',  [DocumentController::class, 'download']);
    Route::post('/documents/{document}/file',     [DocumentController::class, 'replaceFile']);
    Route::delete('/documents/{document}',        [DocumentController::class, 'destroy']);
    Route::post('/documents/{document}/restore',  [DocumentController::class, 'restore']);

    // Search + Audit logs
    Route::get('/search',     [DocumentController::class, 'search']);
});
