<?php

namespace Database\Seeders;

use App\Models\CourseOffering;
use App\Models\CourseOfferingInstructor;
use App\Models\FormAssignment;
use App\Models\Notification;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        // Truncate existing notifications to start fresh
        DB::table('notifications')->truncate();

        $adminUserIds = Role::where('role_name', 'admin')
            ->first()
            ?->users()
            ->pluck('users.id')
            ->toArray() ?? [];

        // 1. For each course_offering_instructor → notify the instructor they were assigned
        $rows = CourseOfferingInstructor::with(['offering', 'offering.course'])->get();

        foreach ($rows as $row) {
            $offering = $row->offering;
            if (!$offering || !$offering->course) continue;

            Notification::create([
                'user_id'  => $row->instructor_id,
                'text'     => "You have been assigned to {$offering->course->course_code} for {$offering->semester}.",
                'date'     => now(),
                'semester' => $offering->semester,
            ]);
        }

        // 2. For each submitted form → notify admins + coordinator
        $submitted = CourseOfferingInstructor::where('is_submitted', true)
            ->with(['offering', 'offering.course', 'offering.coordinator', 'instructor'])
            ->get();

        foreach ($submitted as $row) {
            $offering = $row->offering;
            if (!$offering || !$offering->course) continue;

            $instructor = $row->instructor;
            $name = $instructor ? trim(($instructor->first_name ?? '') . ' ' . ($instructor->last_name ?? '')) : 'An instructor';
            $text = "{$name} has submitted the form for {$offering->course->course_code} ({$offering->semester}).";

            foreach ($adminUserIds as $adminId) {
                Notification::create([
                    'user_id'  => $adminId,
                    'text'     => $text,
                    'date'     => now(),
                    'semester' => $offering->semester,
                ]);
            }

            if ($offering->coordinator_id) {
                Notification::create([
                    'user_id'  => $offering->coordinator_id,
                    'text'     => $text,
                    'date'     => now(),
                    'semester' => $offering->semester,
                ]);
            }
        }

        // 3. For each form assignment → notify instructors of that offering
        $assignments = FormAssignment::with(['offering', 'offering.course', 'offering.instructors'])->get();

        foreach ($assignments as $assignment) {
            $offering = $assignment->offering;
            if (!$offering || !$offering->course) continue;

            foreach ($offering->instructors as $instructor) {
                Notification::create([
                    'user_id'  => $instructor->id,
                    'text'     => "A new SO assignment has been added to your form for {$offering->course->course_code} ({$assignment->semester}).",
                    'date'     => now(),
                    'semester' => $assignment->semester,
                ]);
            }
        }

        $total = Notification::count();
        $this->command->info("NotificationSeeder: created {$total} notifications.");
    }
}
