<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('feedback', function (Blueprint $table) {
            // subject should be optional (your UI allows empty)
            if (!Schema::hasColumn('feedback', 'subject')) {
                $table->string('subject')->nullable()->after('user_id');
            } else {
                $table->string('subject')->nullable()->change();
            }

            if (!Schema::hasColumn('feedback', 'message')) {
                $table->text('message')->after('subject');
            }

            if (!Schema::hasColumn('feedback', 'status')) {
                $table->string('status')->default('open')->after('message');
            }

            if (!Schema::hasColumn('feedback', 'resolved_at')) {
                $table->timestamp('resolved_at')->nullable()->after('status');
            }

            if (!Schema::hasColumn('feedback', 'resolved_by')) {
                $table->unsignedBigInteger('resolved_by')->nullable()->after('resolved_at');
            }

            if (!Schema::hasColumn('feedback', 'ip')) {
                $table->string('ip', 45)->nullable()->after('resolved_by');
            }
        });
    }

    public function down(): void
    {
        Schema::table('feedback', function (Blueprint $table) {
            $table->dropColumn(['subject', 'message', 'status', 'resolved_at', 'resolved_by', 'ip']);
        });
    }
};
