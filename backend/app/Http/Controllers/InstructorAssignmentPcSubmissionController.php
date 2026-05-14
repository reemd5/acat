<?php

namespace App\Http\Controllers;

use App\Models\AssessmentMethod;
use App\Models\InstructorAssignmentPcSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class InstructorAssignmentPcSubmissionController extends Controller
{
    private const FILE_UPLOAD_METHODS  = ['Scoring Rubrics', 'Stakeholder Survey', 'Exit Survey'];
    private const EMBEDDED_METHOD      = 'Embedded Assessment';

    public function index(Request $request)
    {
        try {
            $request->validate([
                'instructor_id' => 'required|integer|exists:users,id',
                'offering_id'   => 'required|integer|exists:course_offerings,id',
            ]);

            $records = InstructorAssignmentPcSubmission::where('instructor_id', $request->instructor_id)
                ->whereHas('formAssignment', function ($q) use ($request) {
                    $q->where('offering_id', $request->offering_id);
                })
                ->get();

            return response()->json($records);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error fetching submissions.', 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $isSave = $request->input('mode') === 'save';

            $request->validate([
                'instructor_id'      => 'required|integer|exists:users,id',
                'form_assignment_id' => 'required|integer|exists:form_assignments,id',
            ]);

            if (!$isSave) {
                $request->validate([
                    'submissions'        => 'required|array|min:1',
                    'submissions.*.form_assignment_pc_id' => 'required|integer|exists:form_assignment_pcs,id',
                    'submissions.*.assessment_method_id'  => 'required|integer|exists:assessment_methods,id',
                    'submissions.*.average_score'         => 'required|numeric|min:0|max:100',
                    'submissions.*.percentage_of_students_meeting_performance_standard' => 'required|numeric|min:0|max:100',
                ]);
            }

            $submissions = $request->input('submissions', []);
            $saved = [];

            foreach ($submissions as $item) {
                $pcId = $item['form_assignment_pc_id'] ?? null;
                if (!$pcId) continue;

                // In save mode, skip entries with no assessment method chosen
                if ($isSave && empty($item['assessment_method_id'])) {
                    continue;
                }

                $method     = AssessmentMethod::find($item['assessment_method_id']);
                $methodName = $method?->method_name ?? '';

                // Conditional validation (applies in both save and submit modes when method is set)
                if (in_array($methodName, self::FILE_UPLOAD_METHODS)) {
                    $existing = InstructorAssignmentPcSubmission::where([
                        'instructor_id'         => $request->instructor_id,
                        'form_assignment_id'    => $request->form_assignment_id,
                        'form_assignment_pc_id' => $pcId,
                    ])->value('upload_path');

                    if (!$request->hasFile("file_{$pcId}") && !$existing) {
                        return response()->json([
                            'message' => "A file upload is required for assessment method '{$methodName}' (PC ID {$pcId}).",
                        ], 422);
                    }
                }

                if ($methodName === self::EMBEDDED_METHOD) {
                    if (empty($item['assessment_type']) || empty($item['question_number'])) {
                        return response()->json([
                            'message' => "Assessment type and question number are required for 'Embedded Assessment' (PC ID {$pcId}).",
                        ], 422);
                    }
                }

                // Build update data
                $updateData = [
                    'assessment_method_id' => $item['assessment_method_id'],
                    'average_score'        => isset($item['average_score']) && $item['average_score'] !== '' ? $item['average_score'] : null,
                    'percentage_of_students_meeting_performance_standard' => isset($item['percentage_of_students_meeting_performance_standard']) && $item['percentage_of_students_meeting_performance_standard'] !== ''
                        ? $item['percentage_of_students_meeting_performance_standard']
                        : null,
                    'performance_standard' => isset($item['performance_standard']) && $item['performance_standard'] !== '' ? $item['performance_standard'] : 70,
                    'assessment_type'      => $item['assessment_type'] ?? null,
                    'question_number'      => $item['question_number'] ?? null,
                    'comment'              => $item['comment'] ?? null,
                ];

                // Handle file upload — only update path if a new file is provided
                if ($request->hasFile("file_{$pcId}")) {
                    $updateData['upload_path'] = $request->file("file_{$pcId}")->store('pc_submissions', 'public');
                }

                $record = InstructorAssignmentPcSubmission::updateOrCreate(
                    [
                        'instructor_id'         => $request->instructor_id,
                        'form_assignment_id'    => $request->form_assignment_id,
                        'form_assignment_pc_id' => $pcId,
                    ],
                    $updateData
                );

                $saved[] = $record;
            }

            return response()->json($saved, 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error saving submissions.', 'error' => $e->getMessage()], 500);
        }
    }
}
