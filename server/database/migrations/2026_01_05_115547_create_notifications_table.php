<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // e.g. doc_expiring
            $table->string('title');
            $table->text('message')->nullable();
            $table->json('data')->nullable(); // store doc_id, employee_id, expires_at, etc
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            // prevent duplicates (same user + same doc warning)
            $table->unique(['user_id', 'type', 'title']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
