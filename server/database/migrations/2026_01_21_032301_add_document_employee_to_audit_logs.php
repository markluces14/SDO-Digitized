<?php

// database/migrations/xxxx_xx_xx_add_document_employee_to_audit_logs.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('audit_logs', 'document_id')) {
                $table->unsignedBigInteger('document_id')->nullable()->after('action');
            }
            if (!Schema::hasColumn('audit_logs', 'employee_id')) {
                $table->unsignedBigInteger('employee_id')->nullable()->after('document_id');
            }
            if (!Schema::hasColumn('audit_logs', 'message')) {
                $table->string('message', 255)->nullable()->after('employee_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropColumn(['document_id', 'employee_id', 'message']);
        });
    }
};
