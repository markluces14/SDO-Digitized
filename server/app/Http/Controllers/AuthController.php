<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken; // ← ADD THIS

class AuthController extends Controller
{
    /** POST /api/login */
    public function login(Request $r)
    {
        $data = $r->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        /** @var User|null $user */
        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['These credentials do not match our records.'],
            ]);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'User is disabled.'], 403);
        }

        $plain = $user->createToken('spa')->plainTextToken;

        return response()->json([
            'token' => $plain,
            'user'  => $this->shape($user),
        ]);
    }

    /** GET /api/me (auth:sanctum) */
    public function me(Request $r)
    {
        $user = $r->user();
        return response()->json([
            'id'          => $user->id,
            'name'        => $user->name,
            'email'       => $user->email,
            'role'        => $user->role,
            'is_active'   => $user->is_active,
            'employee_id' => $user->employee_id, // ✅ include this
        ]);
    }

    /** POST /api/logout (auth:sanctum) */
    public function logout(Request $r)
    {
        /** @var User|null $user */
        $user = $r->user();
        $token = $user?->currentAccessToken();

        // Only delete if this is a Sanctum PersonalAccessToken
        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }

        // If you prefer to revoke ALL tokens, use:
        // $user?->tokens()->delete();

        return response()->json(['ok' => true]);
    }

    private function shape(User $u): array
    {
        return [
            'id'          => $u->id,
            'name'        => $u->name,
            'email'       => $u->email,
            'role'        => strtolower($u->role ?? ''),
            'is_active'   => (bool) $u->is_active,
            'employee_id' => $u->employee_id,
        ];
    }
}
