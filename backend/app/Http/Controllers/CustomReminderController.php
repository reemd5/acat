<?php

namespace App\Http\Controllers;

use App\Models\CustomReminder;
use Illuminate\Http\Request;

class CustomReminderController extends Controller
{
    public function index()
    {
        $record = CustomReminder::firstOrCreate(
            ['id' => 1],
            [
                'first_date'     => null,
                'end_date'       => null,
                'emails_per_day' => 1,
            ]
        );

        return response()->json($record);
    }

    public function update(Request $request)
    {
        $request->validate([
            'first_date'     => 'nullable|date',
            'end_date'       => 'nullable|date',
            'emails_per_day' => 'nullable|integer|min:1|max:10',
        ]);

        $record = CustomReminder::updateOrCreate(
            ['id' => 1],
            $request->only(['first_date', 'end_date', 'emails_per_day'])
        );

        return response()->json($record);
    }
}
