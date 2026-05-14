<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AutoReminder extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'first',
        'first_date',
        'middle',
        'middle_date',
        'end',
        'end_date',
    ];

    protected $casts = [
        'first'  => 'boolean',
        'middle' => 'boolean',
        'end'    => 'boolean',
    ];
}
