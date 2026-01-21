<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

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
