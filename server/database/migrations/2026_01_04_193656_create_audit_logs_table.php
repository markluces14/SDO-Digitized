<?php

// database/migrations/xxxx_xx_xx_create_audit_logs_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            // who/what
            $table->string('action', 30); // upload, view, download, replace, delete, restore
            $table->foreignId('employee_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->foreignId('document_id')->nullable()->constrained('documents')->nullOnDelete();

            // request info
            $table->string('ip', 45)->nullable();
            $table->text('user_agent')->nullable();

            // extra info (filename, title, old_path, new_path, etc.)
            $table->json('meta')->nullable();

            $table->timestamps();

            $table->index(['action', 'created_at']);
            $table->index(['employee_id', 'created_at']);
            $table->index(['document_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
