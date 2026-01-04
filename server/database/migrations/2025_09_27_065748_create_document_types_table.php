<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;


return new class extends Migration {
    public function up(): void
    {
        Schema::create('document_types', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->boolean('required')->default(false);
            $table->unsignedInteger('validity_days')->nullable(); // for licenses, NBI, etc.
            $table->timestamps();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('document_types');
    }
};
