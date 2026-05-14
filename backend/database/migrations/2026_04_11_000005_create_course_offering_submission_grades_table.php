<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_offering_submission_grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('offering_id')->constrained('course_offerings')->cascadeOnDelete();
            $table->unsignedSmallInteger('a')->default(0);
            $table->unsignedSmallInteger('a_minus')->default(0);
            $table->unsignedSmallInteger('b_plus')->default(0);
            $table->unsignedSmallInteger('b')->default(0);
            $table->unsignedSmallInteger('b_minus')->default(0);
            $table->unsignedSmallInteger('c_plus')->default(0);
            $table->unsignedSmallInteger('c')->default(0);
            $table->unsignedSmallInteger('c_minus')->default(0);
            $table->unsignedSmallInteger('d_plus')->default(0);
            $table->unsignedSmallInteger('d')->default(0);
            $table->unsignedSmallInteger('f')->default(0);
            $table->unsignedSmallInteger('w')->default(0);
            $table->unsignedSmallInteger('i')->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_offering_submission_grades');
    }
};
