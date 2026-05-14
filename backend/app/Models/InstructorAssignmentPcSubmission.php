<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InstructorAssignmentPcSubmission extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'instructor_id',
        'form_assignment_id',
        'form_assignment_pc_id',
        'assessment_method_id',
        'average_score',
        'percentage_of_students_meeting_performance_standard',
        'upload_path',
        'assessment_type',
        'question_number',
        'comment',
        'performance_standard',
    ];

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function formAssignment(): BelongsTo
    {
        return $this->belongsTo(FormAssignment::class);
    }

    public function formAssignmentPc(): BelongsTo
    {
        return $this->belongsTo(FormAssignmentPc::class);
    }

    public function assessmentMethod(): BelongsTo
    {
        return $this->belongsTo(AssessmentMethod::class);
    }
}
