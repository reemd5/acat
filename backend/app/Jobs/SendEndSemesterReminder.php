<?php

namespace App\Jobs;

use App\Mail\EndSemesterMail;
use App\Models\Reminder;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendEndSemesterReminder implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $setting = Setting::first();
        if (!$setting) {
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
                new EndSemesterMail($instructor->first_name, $instructor->last_name)
            );
        }

        Reminder::create([
            'text'                   => 'End of semester reminder sent to instructors.',
            'date'                   => now()->toDateString(),
            'semester'               => $setting->current_semester,
            'sender_user_role_id'    => 2,
            'recipient_user_role_id' => 2,
        ]);
    }
}
