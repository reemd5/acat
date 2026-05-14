<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('custom_reminders', function (Blueprint $table) {
            $table->id();
            $table->date('first_date')->nullable();
            $table->date('end_date')->nullable();
            $table->unsignedInteger('emails_per_day')->default(1);
        });

        // Seed the singleton row
        DB::table('custom_reminders')->insert([
            'id'             => 1,
            'first_date'     => null,
            'end_date'       => null,
            'emails_per_day' => 1,
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_reminders');
    }
};
