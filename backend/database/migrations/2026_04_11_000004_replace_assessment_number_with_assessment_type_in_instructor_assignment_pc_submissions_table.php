<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('instructor_assignment_pc_submissions', function (Blueprint $table) {
            $table->dropColumn('assessment_number');
            $table->string('assessment_type')->nullable()->after('upload_path');
        });
    }

    public function down(): void
    {
        Schema::table('instructor_assignment_pc_submissions', function (Blueprint $table) {
            $table->dropColumn('assessment_type');
            $table->unsignedSmallInteger('assessment_number')->nullable()->after('upload_path');
        });
    }
};
