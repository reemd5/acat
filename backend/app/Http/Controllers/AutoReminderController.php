<?php

namespace App\Http\Controllers;

use App\Models\AutoReminder;
use Illuminate\Http\Request;

class AutoReminderController extends Controller
{
    public function index()
    {
        $record = AutoReminder::firstOrCreate(
            ['id' => 1],
            [
                'first'       => false,
                'first_date'  => null,
                'middle'      => false,
                'middle_date' => null,
                'end'         => false,
                'end_date'    => null,
            ]
        );

        return response()->json($record);
    }

    public function update(Request $request)
    {
        $request->validate([
            'first'       => 'nullable|boolean',
            'first_date'  => 'nullable|date',
            'middle'      => 'nullable|boolean',
            'middle_date' => 'nullable|date',
            'end'         => 'nullable|boolean',
            'end_date'    => 'nullable|date',
        ]);

        $record = AutoReminder::updateOrCreate(
            ['id' => 1],
            $request->only(['first', 'first_date', 'middle', 'middle_date', 'end', 'end_date'])
        );

        return response()->json($record);
    }
}
