<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropForeign(['user_role_id']);
            $table->dropColumn('user_role_id');
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->unsignedBigInteger('user_role_id')->nullable()->after('user_id');
            $table->foreign('user_role_id')->references('id')->on('user_roles')->cascadeOnDelete();
        });
    }
};
