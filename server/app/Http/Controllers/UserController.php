<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /** Only admins may touch any of these routes */
    private function assertAdmin(Request $r): void
    {
        abort_unless(optional($r->user())->role === 'admin', 403, 'Forbidden');
    }

    /** Allowed roles, stored lowercase in DB */
    private function validRoles(): array
    {
        return ['admin', 'staff', 'employee'];
    }

    public function index(Request $r)
    {
        $this->assertAdmin($r);

        $q = User::query();

        if ($r->filled('q')) {
            $like = '%' . trim($r->q) . '%';
            $q->where(function ($x) use ($like) {
                $x->where('name', 'like', $like)
                    ->orWhere('email', 'like', $like);
            });
        }

        if ($r->filled('role') && in_array(strtolower($r->role), $this->validRoles(), true)) {
            $q->where('role', strtolower($r->role));
        }

        return $q->orderBy('name')->paginate(20);
    }

    public function store(Request $r)
    {
        $this->assertAdmin($r);

        $data = $r->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role'     => ['required', Rule::in($this->validRoles())],
        ]);

        $data['role']      = strtolower($data['role']);
        $data['password']  = Hash::make($data['password']);
        $data['is_active'] = true;

        $user = User::create($data);

        return response()->json($user, 201);
    }

    public function update(Request $r, User $user)
    {
        $this->assertAdmin($r);

        $data = $r->validate([
            'name'  => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'role'  => ['sometimes', Rule::in($this->validRoles())],
        ]);

        if (isset($data['role'])) {
            $data['role'] = strtolower($data['role']);
        }

        $user->update($data);

        return response()->json($user);
    }

    public function resetPassword(Request $r, User $user)
    {
        $this->assertAdmin($r);

        $data = $r->validate([
            'password' => ['required', 'string', 'min:6', 'confirmed'], // expects password_confirmation
        ]);

        $user->update(['password' => Hash::make($data['password'])]);

        return response()->json(['ok' => true]);
    }

    public function toggleActive(Request $r, User $user)
    {
        $this->assertAdmin($r);

        $user->update(['is_active' => ! $user->is_active]);

        return response()->json(['is_active' => (bool) $user->is_active]);
    }

    public function destroy(Request $r, User $user)
    {
        $this->assertAdmin($r);

        $user->delete();

        return response()->noContent();
    }
}
