<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $t) {
            if (!Schema::hasColumn('employees', 'middle_name')) {
                $t->string('middle_name', 100)->nullable();
            }
            if (!Schema::hasColumn('employees', 'place_of_birth')) {
                $t->string('place_of_birth', 150)->nullable();
            }
            if (!Schema::hasColumn('employees', 'birthdate')) {
                $t->date('birthdate')->nullable();
            }
            if (!Schema::hasColumn('employees', 'email')) {
                $t->string('email', 191)->nullable();
            }
            if (!Schema::hasColumn('employees', 'gender')) {
                $t->string('gender', 10)->nullable();
            }
            // we already use 'department' as School (no change here)
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $t) {
            if (Schema::hasColumn('employees', 'middle_name')) {
                $t->dropColumn('middle_name');
            }
            if (Schema::hasColumn('employees', 'place_of_birth')) {
                $t->dropColumn('place_of_birth');
            }
            if (Schema::hasColumn('employees', 'birthdate')) {
                $t->dropColumn('birthdate');
            }
            if (Schema::hasColumn('employees', 'email')) {
                $t->dropColumn('email');
            }
            if (Schema::hasColumn('employees', 'gender')) {
                $t->dropColumn('gender');
            }
        });
    }
};
