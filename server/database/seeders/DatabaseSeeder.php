<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@sdo.local'], // unique key
            [
                'name'      => 'Administrator',
                'password'  => Hash::make('password'), // change later
                'role'      => 'admin',
                'is_active' => true,
            ]
        );
    }
}
