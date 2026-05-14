<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('instructor_assignment_pc_submissions', function (Blueprint $table) {
            $table->decimal('performance_standard', 5, 2)->nullable()->default(70)
                ->after('percentage_of_students_meeting_performance_standard');
        });
    }

    public function down(): void
    {
        Schema::table('instructor_assignment_pc_submissions', function (Blueprint $table) {
            $table->dropColumn('performance_standard');
        });
    }
};
