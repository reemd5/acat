<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Models\CourseOfferingInstructor;
use App\Models\CourseOfferingInstructorImprovement;
use App\Models\CourseOfferingSubmissionGrade;

class CourseOffering extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'course_id',
        'instructor_id',
        'academic_year',
        'coordinator_id',
        'semester',
        'campus_id',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function campus(): BelongsTo
    {
        return $this->belongsTo(Campus::class);
    }

    //relation between offering and user through course_offering_instructors table
    public function instructors()
    {
        return $this->belongsToMany(User::class, 'course_offering_instructors', 'offering_id', 'instructor_id');
    }

    public function offeringInstructors(): HasMany
    {
        return $this->hasMany(CourseOfferingInstructor::class, 'offering_id');
    }

    public function Assignments(): HasMany
    {
        return $this->hasMany(FormAssignment::class, 'offering_id');
    }

    public function coordinator()
    {
        return $this->belongsTo(User::class, 'coordinator_id');
    }

    public function improvements(): HasMany
    {
        return $this->hasMany(CourseOfferingInstructorImprovement::class, 'offering_id');
    }

    public function submissionGrade(): HasOne
    {
        return $this->hasOne(CourseOfferingSubmissionGrade::class, 'offering_id');
    }
}
