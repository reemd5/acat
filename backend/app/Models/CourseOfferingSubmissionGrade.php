<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseOfferingSubmissionGrade extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'offering_id',
        'a', 'a_minus', 'b_plus', 'b', 'b_minus',
        'c_plus', 'c', 'c_minus', 'd_plus', 'd',
        'f', 'w', 'i',
    ];

    public function offering(): BelongsTo
    {
        return $this->belongsTo(CourseOffering::class);
    }
}
