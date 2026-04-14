<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ForcePasswordController;

Route::get('/privacy/status', function (Request $request) {
    return response()->json([
        'accepted' => (bool) $request->session()->get('privacy_accepted', false),
    ]);
});

// ✅ use GET to avoid CSRF 419
Route::get('/privacy/accept', function (Request $request) {
    $request->session()->put('privacy_accepted', true);
    $request->session()->save();

    return response()->json(['ok' => true]);
});
Route::middleware(['auth', 'force.password'])->group(function () {
    Route::get('/force-password', [ForcePasswordController::class, 'show'])
        ->name('password.force.form');

    Route::post('/force-password', [ForcePasswordController::class, 'update'])
        ->name('password.force.update');
});
