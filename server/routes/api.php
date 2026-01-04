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

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/me/password', [AuthController::class, 'changeMyPassword']);

    // Session
    Route::get('/me',      [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Users (admin/staff should be enforced in controller/policy)
    Route::get('users',                 [UserController::class, 'index']);
    Route::post('users',                [UserController::class, 'store']);
    Route::put('users/{user}',          [UserController::class, 'update']);
    Route::patch('users/{user}/password', [UserController::class, 'resetPassword']);
    Route::patch('users/{user}/toggle', [UserController::class, 'toggleActive']);
    Route::delete('users/{user}',       [UserController::class, 'destroy']);

    // Employees
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

    // Restore (choose ONE approach)
    // A) If you use restore(Request $r, Document $document) with route model binding:
    // NOTE: may not find trashed docs unless you customize binding; safer to use option B.
    // Route::post('/documents/{document}/restore',  [DocumentController::class, 'restore']);

    // B) Safer: ID-based restore (works even for soft-deleted records)
    Route::post('/documents/{id}/restore',         [DocumentController::class, 'restoreById']);

    // Search + Audit logs
    Route::get('/search',      [DocumentController::class, 'search']);
    Route::get('/audit-logs',  [AuditLogController::class, 'index']); // admin page
});
