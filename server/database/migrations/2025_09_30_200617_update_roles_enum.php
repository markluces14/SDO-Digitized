<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::statement("
            ALTER TABLE users
            MODIFY role ENUM('Admin','Staff','Employee')
            NOT NULL DEFAULT 'Staff'
        ");
    }

    public function down(): void
    {
        DB::statement("
            ALTER TABLE users
            MODIFY role ENUM('admin','staff','viewer')
            NOT NULL DEFAULT 'staff'
        ");
    }
};
