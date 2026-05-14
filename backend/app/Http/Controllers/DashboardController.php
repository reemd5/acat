<?php

namespace App\Http\Controllers;

use App\Models\CourseOfferingInstructor;
use App\Models\FormAssignment;
use App\Models\InstructorAssignmentPcSubmission;
use App\Models\Notification;
use App\Models\Reminder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    // GET /total-forms?semester=Fall 2025
    // Count of distinct offerings that have at least one form assignment for the semester
    public function getTotalForms(Request $request)
    {
        $semester = $request->query('semester');
        $query = FormAssignment::query();
        if ($semester) {
            $query->where('semester', $semester);
        }
        $total = $query->distinct('offering_id')->count('offering_id');
        return response()->json(['total_forms' => $total]);
    }

    // GET /total-reminders?semester=Fall 2025
    public function getTotalReminders(Request $request)
    {
        $semester = $request->query('semester');
        $query = Reminder::query();
        if ($semester) {
            $query->where('semester', $semester);
        }
        $total = $query->count();
        return response()->json(['total_sent' => $total]);
    }

    // GET /reminder_overview?semester=Fall 2025
    // Returns array of { month, reminders_sent } for the given semester
    public function getReminderOverview(Request $request)
    {
        $semester = $request->query('semester');

        $query = Reminder::whereNotNull('date');
        if ($semester) {
            $query->where('semester', $semester);
        }

        $rows = $query
            ->select(DB::raw("DATE_FORMAT(date, '%b %Y') as month"), DB::raw('COUNT(*) as reminders_sent'), DB::raw('MIN(date) as sort_date'))
            ->groupBy(DB::raw("DATE_FORMAT(date, '%b %Y')"))
            ->orderBy('sort_date')
            ->get(['month', 'reminders_sent']);

        return response()->json($rows);
    }

    // GET /instructors-form-completion-stats?semester=Fall 2025
    // Returns { submitted, in_progress, not_opened } counts
    public function getFormCompletionStats(Request $request)
    {
        $semester = $request->query('semester');
        $query = CourseOfferingInstructor::query();
        if ($semester) {
            $query->whereHas('offering', fn($q) => $q->where('semester', $semester));
        }
        $all = $query->get();

        $submitted  = 0;
        $inProgress = 0;
        $notOpened  = 0;

        foreach ($all as $row) {
            if ($row->is_submitted) {
                $submitted++;
                continue;
            }

            $hasPcSubmissions = InstructorAssignmentPcSubmission::where('instructor_id', $row->instructor_id)
                ->whereHas('formAssignment', fn($q) => $q->where('offering_id', $row->offering_id))
                ->exists();

            if ($hasPcSubmissions) {
                $inProgress++;
            } else {
                $notOpened++;
            }
        }

        return response()->json([
            'submitted'  => $submitted,
            'in_progress'=> $inProgress,
            'not_opened' => $notOpened,
        ]);
    }

    // GET /pending-forms
    public function getPendingForms()
    {
        $count = CourseOfferingInstructor::where('is_submitted', false)->count();
        return response()->json(['count' => $count]);
    }

    // GET /notifications
    public function getNotifications(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([]);
            }

            return response()->json(
                Notification::where('user_id', $user->id)
                    ->orderByDesc('id')
                    ->get()
                    ->map(fn($n) => [
                        'id'       => $n->id,
                        'text'     => $n->text,
                        'date'     => $n->date,
                        'semester' => $n->semester,
                    ])
            );
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // POST /notifications
    public function storeNotification(Request $request)
    {
        $request->validate([
            'text'     => 'required|string',
            'semester' => 'nullable|string',
            'date'     => 'nullable',
        ]);

        $user = $request->user();
        $notification = Notification::create([
            'text'     => $request->text,
            'semester' => $request->semester,
            'date'     => $request->date ?? now(),
            'user_id'  => $user?->id,
        ]);

        return response()->json([
            'id'       => $notification->id,
            'text'     => $notification->text,
            'date'     => $notification->date,
            'semester' => $notification->semester,
        ], 201);
    }

    // DELETE /notifications/{id}
    public function deleteNotification($id)
    {
        Notification::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted.']);
    }
}
