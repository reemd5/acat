<?php

namespace App\Http\Controllers;

use App\Helpers\NotificationHelper;
use App\Models\Campus;
use App\Models\CourseOffering;
use App\Models\Form;
use App\Models\FormAssignment;
use Illuminate\Http\Request;

class FormAssignmentController extends Controller
{
    public function index(Request $request)
    {
        try {

            $queryParams = $request->query();

            $query = FormAssignment::query();

            //filter by so_id if provided
            if (isset($queryParams['so_id'])) {
                $query->where('so_id', $queryParams['so_id']);
            }

            //filter by course_id if provided
            if (isset($queryParams['course_id'])) {
                $query->where('course_id', $queryParams['course_id']);
            }

            $formAssignments = $query->with(['offering','offering.instructors','offering.course', 'offering.campus','AssignmentPcs','AssignmentPcs.pc'])->get();

            return response()->json($formAssignments);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error retrieving form assignments.', 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                "academic_year" => "required|string",
                "campus_id" => "required|integer|exists:campuses,id",
                "semester" => "required|string",
                "so_id" => "required|integer",
                "offering_id" => "required|integer|exists:course_offerings,id",
                "pc_ids" => "required|array"
            ]);

            $form = Form::first();

            $assignment = FormAssignment::create([
                'form_id' => $form->id ?? 1,
                'so_id' => $validated['so_id'],
                'offering_id' => $validated['offering_id'],
                "academic_year" => $validated['academic_year'],
                "semester" => $validated['semester'],
                "campus_id" => $validated['campus_id']
            ]);

            $assignment->AssignmentPcs()->createMany(
                array_map(function ($pc_id) {
                    return ['pc_id' => $pc_id];
                }, $validated['pc_ids'])
            );

            // Notify each instructor assigned to this offering
            $offering = CourseOffering::with(['course', 'instructors'])->find($validated['offering_id']);
            foreach ($offering->instructors as $instructor) {
                NotificationHelper::notify(
                    $instructor->id,
                    "A new SO assignment has been added to your form for {$offering->course->course_code} ({$validated['semester']}).",
                    $validated['semester']
                );
            }

            return response()->json($assignment->load(['offering','offering.instructors','offering.course','AssignmentPcs','AssignmentPcs.pc']), 201);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error adding form assignments.', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(FormAssignment $formAssignment)
    {
        try{
            return response()->json($formAssignment->load(['offering','offering.instructors','offering.course','AssignmentPcs','AssignmentPcs.pc']));
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error retrieving form assignment.', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try{
            $validated = $request->validate([
                "academic_year" => "required|string",
                "campus_id" => "required|integer|exists:campuses,id",
                "semester" => "required|string",
                "so_id" => "required|integer",
                "offering_id" => "required|integer|exists:course_offerings,id",
                "pc_ids" => "required|array"
            ]);

            $formAssignment = FormAssignment::find($id);
            if (!$formAssignment) {
                return response()->json(['message' => 'Form assignment not found.'], 404);
            }

            $formAssignment->update($validated);
           
            // Sync PCs
            $formAssignment->AssignmentPcs()->delete();
            
            foreach ($validated['pc_ids'] as $pc_id) {
                $formAssignment->AssignmentPcs()->create(['pc_id' => $pc_id,'form_assignment_id' => $id]);
            }


            return response()->json(['message' => 'Form assignment updated successfully.', 'data' => $formAssignment]);

        }catch (\Exception $e) {
            return response()->json(['message' => 'Error updating form assignment.', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try{
            $formAssignment = FormAssignment::find($id);
            if (!$formAssignment) {
                return response()->json(['message' => 'Form assignment not found.'], 404);
            }


            $formAssignment->delete();
            return response()->json(['message' => 'Form assignment deleted successfully.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error deleting form assignment.', 'error' => $e->getMessage()], 500);
        }
    }
}
