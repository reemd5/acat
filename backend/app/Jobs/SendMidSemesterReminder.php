<?php

namespace App\Jobs;

use App\Mail\MidSemesterMail;
use App\Models\Reminder;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendMidSemesterReminder implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $setting = Setting::first();
        if (!$setting) {
            echo "[MidSemesterReminder] No settings found.\n";
            return;
        }

        echo "[MidSemesterReminder] Semester: {$setting->current_semester} | Academic year: {$setting->academic_year}\n";

        $instructors = User::join('course_offering_instructors', 'users.id', '=', 'course_offering_instructors.instructor_id')
            ->join('course_offerings', 'course_offerings.id', '=', 'course_offering_instructors.offering_id')
            ->where('course_offerings.semester', $setting->current_semester)
            ->where('course_offerings.academic_year', $setting->academic_year)
            ->distinct()
            ->get(['users.*']);

        echo "[MidSemesterReminder] Instructors found: {$instructors->count()}\n";
        foreach ($instructors as $instructor) {
            echo "  - [{$instructor->id}] {$instructor->first_name} {$instructor->last_name} <{$instructor->email}>\n";
        }

        foreach ($instructors as $instructor) {
            Mail::to($instructor->email)->send(
                new MidSemesterMail($instructor->first_name, $instructor->last_name)
            );
            echo "[MidSemesterReminder] Mail sent to: {$instructor->email}\n";
        }

        Reminder::create([
            'text'                   => 'Mid-semester reminder sent to instructors.',
            'date'                   => now()->toDateString(),
            'semester'               => $setting->current_semester,
            'sender_user_role_id'    => 2,
            'recipient_user_role_id' => 2,
        ]);
    }
}
