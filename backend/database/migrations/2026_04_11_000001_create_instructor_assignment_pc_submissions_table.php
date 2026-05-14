<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('instructor_assignment_pc_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('instructor_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('form_assignment_id')->constrained('form_assignments')->cascadeOnDelete();
            $table->unsignedBigInteger('form_assignment_pc_id');
            $table->foreign('form_assignment_pc_id', 'iapcs_form_assignment_pc_fk')
                  ->references('id')->on('form_assignment_pcs')->cascadeOnDelete();
            $table->unsignedBigInteger('assessment_method_id');
            $table->foreign('assessment_method_id', 'iapcs_assessment_method_fk')
                  ->references('id')->on('assessment_methods')->cascadeOnDelete();
            $table->decimal('average_score', 5, 2);
            $table->decimal('percentage_of_students_meeting_performance_standard', 5, 2);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('instructor_assignment_pc_submissions');
    }
};
