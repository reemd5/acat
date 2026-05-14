<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_offering_instructor_improvements', function (Blueprint $table) {
            $table->unique(['offering_id', 'instructor_id'], 'coii_offering_instructor_unique');
        });
    }

    public function down(): void
    {
        Schema::table('course_offering_instructor_improvements', function (Blueprint $table) {
            $table->dropUnique('coii_offering_instructor_unique');
        });
    }
};
