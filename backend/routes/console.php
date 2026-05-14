<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Console\Scheduling\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');


app(Schedule::class)->command('reminders:check')->dailyAt('13:00')->withoutOverlapping();

app(Schedule::class)->command('custom-reminders:send')->dailyAt('13:00')->withoutOverlapping();