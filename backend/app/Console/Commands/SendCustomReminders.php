<?php

namespace App\Console\Commands;

use App\Mail\SendCustomReminderMail;
use App\Models\CustomReminder;
use App\Models\Reminder;
use App\Models\Setting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendCustomReminders extends Command
{
    protected $signature   = 'custom-reminders:send';
    protected $description = 'Send custom reminder emails to instructors if today falls within the configured date range.';

    public function handle(): void
    {
        $record = CustomReminder::first();

        if (!$record || !$record->first_date || !$record->end_date) {
            $this->info('No custom reminder date range configured.');
            return;
        }

        $today     = Carbon::today();
        $startDate = Carbon::parse($record->first_date)->startOfDay();
        $endDate   = Carbon::parse($record->end_date)->startOfDay();

        if (!$today->between($startDate, $endDate)) {
            $this->info('Today is outside the custom reminder date range.');
            return;
        }

        $setting = Setting::first();
        if (!$setting) {
            $this->error('No settings record found.');
            return;
        }

        $instructors = User::join('course_offering_instructors', 'users.id', '=', 'course_offering_instructors.instructor_id')
            ->join('course_offerings', 'course_offerings.id', '=', 'course_offering_instructors.offering_id')
            ->where('course_offerings.semester', $setting->current_semester)
            ->where('course_offerings.academic_year', $setting->academic_year)
            ->distinct()
            ->get(['users.*']);

        foreach ($instructors as $instructor) {
            Mail::to($instructor->email)->send(
                new SendCustomReminderMail($instructor->first_name, $instructor->last_name)
            );
        }

        Reminder::create([
            'text'                   => 'Custom reminder sent to instructors.',
            'date'                   => now()->toDateString(),
            'semester'               => $setting->current_semester,
            'sender_user_role_id'    => 2,
            'recipient_user_role_id' => 2,
        ]);

        $this->info('Custom reminders sent to ' . $instructors->count() . ' instructor(s).');
    }
}
