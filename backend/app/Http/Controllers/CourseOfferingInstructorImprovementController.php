<?php

namespace App\Http\Controllers;

use App\Models\CourseOffering;
use App\Models\CourseOfferingInstructorImprovement;
use App\Models\CourseOfferingSubmissionGrade;
use App\Models\InstructorAssignmentPcSubmission;
use Illuminate\Http\Request;

class CourseOfferingInstructorImprovementController extends Controller
{
    public function getDashboardStats(Request $request)
    {
        try {
            $coordinator = $request->user();

            if (!$coordinator) {
                return response()->json(['message' => 'Unauthorized.'], 401);
            }

            $offeringsQuery = CourseOffering::where('coordinator_id', $coordinator->id);

            if ($request->semester) {
                $offeringsQuery->where('semester', $request->semester);
            }

            $offeringIds = $offeringsQuery->pluck('id');

            $allRecords = CourseOfferingInstructorImprovement::whereIn('offering_id', $offeringIds)->get();

            $formSubmissions = $allRecords->count();
            $myInstructors = $allRecords->pluck('instructor_id')->unique()->count();
            $withImprovements = $allRecords->filter(fn($r) => !empty(trim($r->improvements ?? '')))->count();
            $withoutImprovements = $formSubmissions - $withImprovements;

            return response()->json([[
                'form_submissions'       => $formSubmissions,
                'my_instructors'         => $myInstructors,
                'number_of_improvements' => $withImprovements,
                'no_improvements'        => $withoutImprovements,
            ]]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error fetching dashboard stats.', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(Request $request)
    {
        try {
            $request->validate([
                'offering_id'   => 'required|integer|exists:course_offerings,id',
                'instructor_id' => 'required|integer|exists:users,id',
            ]);

            $record = CourseOfferingInstructorImprovement::where([
                'offering_id'   => $request->offering_id,
                'instructor_id' => $request->instructor_id,
            ])->first();

            return response()->json($record);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error fetching improvements.', 'error' => $e->getMessage()], 500);
        }
    }

    public function getCoordinatorImprovements(Request $request)
    {
        try {
            $coordinator = $request->user();

            if (!$coordinator) {
                return response()->json(['message' => 'Unauthorized.'], 401);
            }

            $semester = $request->query('semester');

            $improvements = CourseOfferingInstructorImprovement::whereHas('offering', function ($query) use ($coordinator, $semester) {
                $query->where('coordinator_id', $coordinator->id);
                if ($semester) {
                    $query->where('semester', $semester);
                }
            })->with(['offering.course', 'instructor'])->get();

            $result = $improvements->map(function ($item) {
                $offeringId = $item->offering_id;
                $instructorId = $item->instructor_id;

                $gradeDistribution = CourseOfferingSubmissionGrade::where('offering_id', $offeringId)->first();

                $pcSubmissions = InstructorAssignmentPcSubmission::where('instructor_id', $instructorId)
                    ->whereHas('formAssignment', function ($q) use ($offeringId) {
                        $q->where('offering_id', $offeringId);
                    })
                    ->with(['assessmentMethod', 'formAssignmentPc.pc'])
                    ->get()
                    ->map(function ($sub) {
                        return [
                            'pc_code'                     => $sub->formAssignmentPc->pc->pc_code ?? null,
                            'pc_description'              => $sub->formAssignmentPc->pc->description ?? null,
                            'assessment_method'           => $sub->assessmentMethod->method_name ?? null,
                            'assessment_type'             => $sub->assessment_type,
                            'question_number'             => $sub->question_number,
                            'average_score'               => $sub->average_score,
                            'percentage_meeting_standard' => $sub->percentage_of_students_meeting_performance_standard,
                            'performance_standard'        => $sub->performance_standard,
                            'comment'                     => $sub->comment,
                            'upload_path'                 => $sub->upload_path,
                        ];
                    });

                return [
                    'id'                 => $item->id,
                    'semester'           => $item->offering->semester,
                    'course_code'        => $item->offering->course->course_code ?? null,
                    'course_name'        => $item->offering->course->course_name ?? null,
                    'instructor_name'    => trim(($item->instructor->first_name ?? '') . ' ' . ($item->instructor->last_name ?? '')),
                    'submitted_at'       => $item->submitted_at,
                    'improvement_text'   => $item->improvements,
                    'grade_distribution' => $gradeDistribution,
                    'pc_submissions'     => $pcSubmissions,
                ];
            });

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error fetching coordinator improvements.', 'error' => $e->getMessage()], 500);
        }
    }

    public function showDetail(Request $request, $id)
    {
        try {
            $coordinator = $request->user();

            $item = CourseOfferingInstructorImprovement::where('id', $id)
                ->whereHas('offering', fn($q) => $q->where('coordinator_id', $coordinator->id))
                ->with(['offering.course', 'instructor'])
                ->firstOrFail();

            $offeringId   = $item->offering_id;
            $instructorId = $item->instructor_id;

            $gradeDistribution = CourseOfferingSubmissionGrade::where('offering_id', $offeringId)->first();

            $pcSubmissions = InstructorAssignmentPcSubmission::where('instructor_id', $instructorId)
                ->whereHas('formAssignment', fn($q) => $q->where('offering_id', $offeringId))
                ->with(['assessmentMethod', 'formAssignmentPc.pc'])
                ->get()
                ->map(fn($sub) => [
                    'pc_code'                    => $sub->formAssignmentPc->pc->pc_code ?? null,
                    'pc_description'             => $sub->formAssignmentPc->pc->description ?? null,
                    'assessment_method'          => $sub->assessmentMethod->method_name ?? null,
                    'assessment_type'             => $sub->assessment_type,
                    'question_number'             => $sub->question_number,
                    'average_score'               => $sub->average_score,
                    'percentage_meeting_standard' => $sub->percentage_of_students_meeting_performance_standard,
                    'performance_standard'       => $sub->performance_standard,
                    'comment'                    => $sub->comment,
                    'upload_path'                => $sub->upload_path,
                ]);

            return response()->json([
                'id'                 => $item->id,
                'semester'           => $item->offering->semester,
                'course_code'        => $item->offering->course->course_code ?? null,
                'course_name'        => $item->offering->course->course_name ?? null,
                'instructor_name'    => trim(($item->instructor->first_name ?? '') . ' ' . ($item->instructor->last_name ?? '')),
                'improvement_text'   => $item->improvements,
                'grade_distribution' => $gradeDistribution,
                'pc_submissions'     => $pcSubmissions,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Not found.', 'error' => $e->getMessage()], 404);
        }
    }

    public function getCoordinatorComparison(Request $request)
    {
        try {
            $coordinator = $request->user();

            if (!$coordinator) {
                return response()->json(['message' => 'Unauthorized.'], 401);
            }

            $offerings = CourseOffering::where('coordinator_id', $coordinator->id)
                ->with(['course', 'instructors'])
                ->get();

            $result = [];

            foreach ($offerings as $offering) {
                foreach ($offering->instructors as $instructor) {
                    $pcSubmissions = InstructorAssignmentPcSubmission::where('instructor_id', $instructor->id)
                        ->whereHas('formAssignment', fn($q) => $q->where('offering_id', $offering->id))
                        ->with(['formAssignmentPc.pc.so'])
                        ->get();

                    if ($pcSubmissions->isEmpty()) continue;

                    $soScores = $pcSubmissions
                        ->filter(fn($sub) => $sub->formAssignmentPc?->pc?->so !== null)
                        ->groupBy(fn($sub) => $sub->formAssignmentPc->pc->so->so_code)
                        ->map(fn($group, $soCode) => [
                            'so_code'    => $soCode,
                            'percentage' => round($group->avg('percentage_of_students_meeting_performance_standard'), 1),
                        ])
                        ->values();

                    if ($soScores->isEmpty()) continue;

                    $result[] = [
                        'id'              => $offering->id . '_' . $instructor->id,
                        'semester'        => $offering->semester,
                        'course_code'     => $offering->course->course_code ?? null,
                        'course_name'     => $offering->course->course_name ?? null,
                        'instructor_name' => trim(($instructor->first_name ?? '') . ' ' . ($instructor->last_name ?? '')),
                        'so_scores'       => $soScores,
                    ];
                }
            }

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error fetching comparison.', 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'offering_id'   => 'required|integer|exists:course_offerings,id',
                'instructor_id' => 'required|integer|exists:users,id',
                'improvements'  => 'nullable|string',
            ]);

            $record = CourseOfferingInstructorImprovement::updateOrCreate(
                [
                    'offering_id'   => $request->offering_id,
                    'instructor_id' => $request->instructor_id,
                ],
                ['improvements' => $request->improvements, 'submitted_at' => now()]
            );

            return response()->json($record, 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error saving improvements.', 'error' => $e->getMessage()], 500);
        }
    }
}
