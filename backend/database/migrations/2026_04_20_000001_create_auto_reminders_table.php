<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('auto_reminders', function (Blueprint $table) {
            $table->id();
            $table->boolean('first')->default(false);
            $table->date('first_date')->nullable();
            $table->boolean('middle')->default(false);
            $table->date('middle_date')->nullable();
            $table->boolean('end')->default(false);
            $table->date('end_date')->nullable();
        });

        // Seed the singleton row
        DB::table('auto_reminders')->insert([
            'id'          => 1,
            'first'       => false,
            'first_date'  => null,
            'middle'      => false,
            'middle_date' => null,
            'end'         => false,
            'end_date'    => null,
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('auto_reminders');
    }
};
