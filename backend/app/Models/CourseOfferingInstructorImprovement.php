<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseOfferingInstructorImprovement extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'offering_id',
        'instructor_id',
        'improvements',
        'submitted_at',
    ];

    public function offering(): BelongsTo
    {
        return $this->belongsTo(CourseOffering::class);
    }

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }
}
