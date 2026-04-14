<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    /** POST /api/login */
    public function login(Request $r)
    {
        $r->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $r->email)->first();

        if (! $user || ! Hash::check($r->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'Account disabled'], 403);
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'must_change_password' => (bool) $user->must_change_password,
            ],
        ]);
    }


    /** GET /api/me (auth:sanctum) */
    public function me(Request $r)
    {
        $user = $r->user();

        return response()->json([
            'id'                   => $user->id,
            'name'                 => $user->name,
            'email'                => $user->email,
            'role'                 => $user->role,
            'is_active'            => (bool) $user->is_active,
            'employee_id'          => $user->employee_id,
            'must_change_password' => (bool) $user->must_change_password,
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
    public function changeMyPassword(Request $r)
    {
        $user = $r->user();

        $rules = [
            'password' => 'required|min:8|confirmed',
        ];

        if (! $user->must_change_password) {
            $rules['current_password'] = 'required';
        }

        $r->validate($rules);

        if (! $user->must_change_password) {
            if (! Hash::check($r->current_password, $user->password)) {
                return response()->json(['message' => 'Current password incorrect'], 422);
            }
        }

        $user->update([
            'password' => Hash::make($r->password),
            'must_change_password' => false,
            'password_changed_at' => now(),
        ]);

        return response()->json(['ok' => true]);
    }
}
