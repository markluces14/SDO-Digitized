<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'employee_id',
        'is_active',
        'must_change_password',
    ];


    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active'         => 'boolean',
        'employee_id'       => 'integer',
        'must_change_password' => 'boolean',
    ];

    protected $appends = ['role_label'];

    /**
     * Persist enum-friendly value (Admin/Staff/Employee) in DB.
     */
    public function setRoleAttribute($value): void
    {
        $v = strtolower((string) $value);
        $this->attributes['role'] =
            $v === 'admin'    ? 'Admin' : ($v === 'employee' ? 'Employee' : 'Staff'); // default Staff
    }

    /**
     * Always expose role to the app in lowercase (admin/staff/employee).
     */
    public function getRoleAttribute($value): string
    {
        return strtolower((string) $value);
    }

    /**
     * Human-readable role label for UI (Admin/Staff/Employee).
     */
    public function getRoleLabelAttribute(): string
    {
        return ucfirst($this->role); // role accessor already lowercases
    }

    /**
     * Ensure passwords are hashed when set (skip if already bcrypt).
     */
    public function setPasswordAttribute($value): void
    {
        $value = (string) $value;
        if ($value !== '' && !Str::startsWith($value, '$2y$')) {
            $this->attributes['password'] = Hash::make($value);
        } else {
            $this->attributes['password'] = $value;
        }
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
}
