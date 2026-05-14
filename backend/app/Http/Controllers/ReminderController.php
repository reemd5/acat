<?php

namespace App\Http\Controllers;

use App\Models\Reminder;
use Illuminate\Http\Request;

class ReminderController extends Controller
{
    public function index(Request $request)
    {
        $semester = $request->query('semester');
        $query = Reminder::query();
        if ($semester) {
            $query->where('semester', $semester);
        }
        return response()->json($query->orderByDesc('id')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'text'     => 'required|string',
            'semester' => 'nullable|string',
            'date'     => 'nullable',
        ]);

        $reminder = Reminder::create([
            'text'                    => $request->text,
            'date'                    => $request->date ? date('Y-m-d', strtotime($request->date)) : now()->toDateString(),
            'semester'                => $request->semester,
            'sender_user_role_id'     => 1,
            'recipient_user_role_id'  => 1,
        ]);

        return response()->json($reminder, 201);
    }

    public function show(Reminder $reminder)
    {
        return response()->json($reminder);
    }

    public function update(Request $request, Reminder $reminder)
    {
        $reminder->update($request->only(['text', 'date', 'semester']));
        return response()->json($reminder);
    }

    public function destroy(Reminder $reminder)
    {
        $reminder->delete();
        return response()->json(['message' => 'Deleted.']);
    }
}
