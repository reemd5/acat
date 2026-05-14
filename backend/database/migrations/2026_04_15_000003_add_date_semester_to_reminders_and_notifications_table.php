<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reminders', function (Blueprint $table) {
            $table->date('date')->nullable()->after('text');
            $table->string('semester')->nullable()->after('date');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->timestamp('date')->nullable()->after('text');
            $table->string('semester')->nullable()->after('date');
        });
    }

    public function down(): void
    {
        Schema::table('reminders', function (Blueprint $table) {
            $table->dropColumn(['date', 'semester']);
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn(['date', 'semester']);
        });
    }
};
