<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('instructor_assignment_pc_submissions', function (Blueprint $table) {
            $table->string('upload_path')->nullable()->after('percentage_of_students_meeting_performance_standard');
            $table->unsignedSmallInteger('assessment_number')->nullable()->after('upload_path');
            $table->unsignedSmallInteger('question_number')->nullable()->after('assessment_number');
        });
    }

    public function down(): void
    {
        Schema::table('instructor_assignment_pc_submissions', function (Blueprint $table) {
            $table->dropColumn(['upload_path', 'assessment_number', 'question_number']);
        });
    }
};
