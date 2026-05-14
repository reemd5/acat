<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomReminder extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'first_date',
        'end_date',
        'emails_per_day',
    ];
}
