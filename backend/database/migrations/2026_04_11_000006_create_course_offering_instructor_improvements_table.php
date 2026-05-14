<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_offering_instructor_improvements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('offering_id')->constrained('course_offerings')->cascadeOnDelete();
            $table->foreignId('instructor_id')->constrained('users')->cascadeOnDelete();
            $table->text('improvements')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_offering_instructor_improvements');
    }
};
