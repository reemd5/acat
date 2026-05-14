<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class InstructorAssignmentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        //check if have instructor role
        if (!$user->hasRole('instructor')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $assignments = $user->instructorAssignments()->with(['offering','offering.instructors','offering.course', 'offering.campus','AssignmentPcs','AssignmentPcs.pc'])->get();

        return response()->json($assignments);
    }
}
