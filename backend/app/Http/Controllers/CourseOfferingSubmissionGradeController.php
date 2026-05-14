<?php

namespace App\Http\Controllers;

use App\Models\CourseOfferingSubmissionGrade;
use Illuminate\Http\Request;

class CourseOfferingSubmissionGradeController extends Controller
{
    private const GRADE_COLUMNS = ['a', 'a_minus', 'b_plus', 'b', 'b_minus', 'c_plus', 'c', 'c_minus', 'd_plus', 'd', 'f', 'w', 'i'];

    public function show(Request $request)
    {
        try {
            $request->validate([
                'offering_id' => 'required|integer|exists:course_offerings,id',
            ]);

            $record = CourseOfferingSubmissionGrade::where('offering_id', $request->offering_id)->first();

            return response()->json($record);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error fetching grade distribution.', 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $rules = ['offering_id' => 'required|integer|exists:course_offerings,id'];
            foreach (self::GRADE_COLUMNS as $col) {
                $rules[$col] = 'nullable|integer|min:0';
            }
            $request->validate($rules);

            $gradeData = [];
            foreach (self::GRADE_COLUMNS as $col) {
                $gradeData[$col] = $request->input($col, 0);
            }

            $record = CourseOfferingSubmissionGrade::updateOrCreate(
                ['offering_id' => $request->offering_id],
                $gradeData
            );

            return response()->json($record, 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error saving grade distribution.', 'error' => $e->getMessage()], 500);
        }
    }
}
