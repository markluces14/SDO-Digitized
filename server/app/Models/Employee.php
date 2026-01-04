<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use app\Models\User;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'employee_no',
        'email',
        'first_name',
        'middle_name',
        'last_name',
        'place_of_birth',
        'birthdate',
        'gender',
        'position',
        'department',
        'date_hired',
    ];
    public function user()
    {
        return $this->hasOne(User::class, 'employee_id');
    }

    protected $casts = [
        'birthdate'  => 'date',
        'date_hired' => 'date',
    ];

    /**
     * Employee has many documents
     */
    public function documents()
    {
        return $this->hasMany(Document::class);
    }
}
