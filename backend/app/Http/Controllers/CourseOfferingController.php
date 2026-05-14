<?php

namespace App\Http\Controllers;

use App\Helpers\NotificationHelper;
use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\CourseOfferingInstructor;
use App\Models\User;
use Illuminate\Http\Request;

class CourseOfferingController extends Controller
{

    public function getInstructorOfferings(Request $request)
    {
        try {
            $user = $request->user();

            if(!$user || !in_array('instructor', $user->roles()->pluck('role_name')->toArray())) {
                return response()->json(['message' => 'Unauthorized. User is not an instructor.'], 403);
            }

            $semester = $request->query('semester');

            $offeringsQuery = CourseOffering::whereHas('instructors', function ($query) use ($user) {
                $query->where('users.id', $user->id);
            });

            if ($semester) {
                $offeringsQuery->where('semester', $semester);
            }

            $offerings = $offeringsQuery->with([
                'course',
                'campus',
                'assignments' => function ($query) use ($user) {
                    $query->with([
                        'AssignmentPcs',
                        'instructorPcSubmissions' => function ($q) use ($user) {
                            $q->where('instructor_id', $user->id);
                        },
                    ]);
                },
            ])->get();

            // Attach is_submitted per offering for this instructor
            $offeringIds = $offerings->pluck('id');
            $submittedIds = CourseOfferingInstructor::where('instructor_id', $user->id)
                ->whereIn('offering_id', $offeringIds)
                ->where('is_submitted', true)
                ->pluck('offering_id')
                ->flip()
                ->toArray();

            $result = $offerings->map(function ($o) use ($submittedIds) {
                $arr = $o->toArray();
                $arr['is_submitted'] = isset($submittedIds[$o->id]);
                return $arr;
            });

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error fetching instructor offerings.', 'error' => $e->getMessage()], 500);
        }
    }
    public function index()
    {
        try{
            $queryParams = request()->only(['semester', 'campus_id', 'course_id']);
            $query = CourseOffering::query();

            if ($queryParams['semester'] ?? false) {
                $query->where('semester', $queryParams['semester']);
            }
            if ($queryParams['campus_id'] ?? false) {
                $query->where('campus_id', $queryParams['campus_id']);
            }
            if ($queryParams['course_id'] ?? false) {
                 $query->where('course_id', $queryParams['course_id']);
             }

             $offerings = $query->with(['course', 'course.sos', 'campus', 'instructors'])
                 ->withCount('improvements as improvements_count')
                 ->get();

             return response()->json($offerings);
         } catch (\Exception $e) {
             return response()->json(['message' => 'Error fetching course offerings.', 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try{
            $request->validate([
                'course_id' => 'required|integer|exists:courses,id',
                'campus_id' => 'required|integer|exists:campuses,id',
                'instructor_ids' => 'required|array',
                'instructor_ids.*' => 'integer|exists:users,id',
                'semester' => 'required|string',
                'academic_year' => 'required|string',
            ]);


            //loop through instrucotr ids and check if they are valid instructors and if they are in the campus
            foreach ($request->instructor_ids as $instructor_id) {
                $instructor = User::find($instructor_id);

                if (!$instructor || !in_array('instructor', $instructor->roles()->pluck('role_name')->toArray())) {
                    return response()->json(['message' => 'Instructor with ID ' . $instructor_id . ' not found or does not have instructor role.'], 400);
                }

                //check if user is in the campus
                if (!$instructor->campuses()->where('campus_id', $request->campus_id)->exists()) {
                    return response()->json(['message' => 'Instructor with ID ' . $instructor_id . ' is not associated with the specified campus.'], 400);
                }
            }

            $academic_year = $request->academic_year;

            $courseOffering = CourseOffering::create([
                'course_id' => $request->course_id,
                'campus_id' => $request->campus_id,
                'academic_year' => $academic_year,
                'semester' => $request->semester,
            ]);

            $courseOffering->offeringInstructors()->createMany(
                array_map(function ($instructor_id) {
                    return ['instructor_id' => $instructor_id];
                }, $request->instructor_ids)
            );

            // Notify each assigned instructor
            $course = Course::find($request->course_id);
            foreach ($request->instructor_ids as $instructorId) {
                NotificationHelper::notify(
                    $instructorId,
                    "You have been assigned to {$course->course_code} for {$request->semester}.",
                    $request->semester
                );
            }

            return response()->json($courseOffering, 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error creating course offering.', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(Request $request, CourseOffering $courseOffering)
    {
        try{
            $offering = $courseOffering->load([
                'assignments',
                'assignments.form',
                'assignments.submissions.submissionValues',
                'coordinator',
                'course',
                'course.sos',
                'assignments.AssignmentPcs',
                'assignments.AssignmentPcs.pc',
            ]);

            $data = $offering->toArray();

            // Attach is_submitted for the requesting instructor
            $instructorId = $request->query('instructor_id');
            if ($instructorId) {
                $row = CourseOfferingInstructor::where([
                    'offering_id'   => $courseOffering->id,
                    'instructor_id' => $instructorId,
                ])->first();
                $data['is_submitted'] = $row ? (bool) $row->is_submitted : false;
            }

            return response()->json($data);
        }catch (\Exception $e) {
            return response()->json(['message' => 'Error finding course offering.', 'error' => $e->getMessage()], 500);
        }
    }

    public function submitInstructorForm(Request $request, $offeringId)
    {
        try {
            $request->validate([
                'instructor_id' => 'required|integer|exists:users,id',
            ]);

            CourseOfferingInstructor::where([
                'offering_id'   => $offeringId,
                'instructor_id' => $request->instructor_id,
            ])->update(['is_submitted' => true]);

            // Notify admin and coordinator
            $offering    = CourseOffering::with(['course', 'coordinator'])->find($offeringId);
            $instructor  = User::find($request->instructor_id);
            $instructorName = trim(($instructor->first_name ?? '') . ' ' . ($instructor->last_name ?? ''));
            $text = "{$instructorName} has submitted the form for {$offering->course->course_code} ({$offering->semester}).";

            NotificationHelper::notifyAdmins($text, $offering->semester);
            if ($offering->coordinator_id) {
                NotificationHelper::notify($offering->coordinator_id, $text, $offering->semester);
            }

            return response()->json(['message' => 'Form submitted successfully.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error submitting form.', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, CourseOffering $courseOffering)
    {
        try{
            $request->validate([
                'course_id' => 'required|integer|exists:courses,id',
                'campus_id' => 'required|integer|exists:campuses,id',
                'instructor_ids' => 'required|array',
                'instructor_ids.*' => 'integer|exists:users,id',
                'semester' => 'required|string',
                'academic_year' => 'required|string',
            ]);

           //loop through instrucotr ids and check if they are valid instructors and if they are in the campus
            foreach ($request->instructor_ids as $instructor_id) {
                $instructor = User::find($instructor_id);

                if (!$instructor || !in_array('instructor', $instructor->roles()->pluck('role_name')->toArray())) {
                    return response()->json(['message' => 'Instructor with ID ' . $instructor_id . ' not found or does not have instructor role.'], 400);
                }

                //check if user is in the campus
                if (!$instructor->campuses()->where('campus_id', $request->campus_id)->exists()) {
                    return response()->json(['message' => 'Instructor with ID ' . $instructor_id . ' is not associated with the specified campus.'], 400);
                }
            }

            $academic_year = $request->academic_year;

          $courseOffering->update([
                'course_id' => $request->course_id,
                'campus_id' => $request->campus_id,
                'academic_year' => $academic_year,
                'semester' => $request->semester,
            ]);

            $courseOffering->offeringInstructors()->delete();
            foreach ($request->instructor_ids as $instructor_id) {
                $courseOffering->offeringInstructors()->create([
                    'instructor_id' => $instructor_id,
                ]);
            }

            return response()->json($courseOffering, 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error creating course offering.', 'error' => $e->getMessage()], 500);
        }
    }

    public function updateCoordinator(Request $request, CourseOffering $courseOffering)
    {
        try {
            $request->validate([
                'coordinator_id' => 'required|integer|exists:users,id',
            ]);

            $coordinator = User::find($request->coordinator_id);

            if (!$coordinator->roles()->pluck('role_name')->contains('coordinator')) {
                return response()->json(['message' => 'Selected user does not have the coordinator role.'], 422);
            }

            if (!$coordinator->campuses()->where('campus_id', $courseOffering->campus_id)->exists()) {
                return response()->json(['message' => 'Coordinator does not belong to the campus of this course offering.'], 422);
            }

            $courseOffering->update(['coordinator_id' => $request->coordinator_id]);

            return response()->json($courseOffering);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error updating coordinator.', 'error' => $e->getMessage()], 500);
        }
    }

    public function getAdminOfferingDetail($id)
    {
        try {
            $offering = CourseOffering::with(['course', 'campus', 'coordinator', 'instructors'])->findOrFail($id);

            $gradeDistribution = \App\Models\CourseOfferingSubmissionGrade::where('offering_id', $id)->first();

            $instructorData = $offering->instructors->map(function ($instructor) use ($id) {
                $pcSubmissions = \App\Models\InstructorAssignmentPcSubmission::where('instructor_id', $instructor->id)
                    ->whereHas('formAssignment', fn($q) => $q->where('offering_id', $id))
                    ->with(['assessmentMethod', 'formAssignmentPc.pc.so'])
                    ->get()
                    ->map(fn($sub) => [
                        'pc_code'                     => $sub->formAssignmentPc->pc->pc_code ?? null,
                        'pc_description'              => $sub->formAssignmentPc->pc->description ?? null,
                        'so_code'                     => $sub->formAssignmentPc->pc->so->so_code ?? null,
                        'assessment_method'           => $sub->assessmentMethod->method_name ?? null,
                        'assessment_type'             => $sub->assessment_type,
                        'question_number'             => $sub->question_number,
                        'average_score'               => $sub->average_score,
                        'percentage_meeting_standard' => $sub->percentage_of_students_meeting_performance_standard,
                        'performance_standard'        => $sub->performance_standard,
                        'comment'                     => $sub->comment,
                        'upload_path'                 => $sub->upload_path,
                    ]);

                $improvement = \App\Models\CourseOfferingInstructorImprovement::where([
                    'offering_id'   => $id,
                    'instructor_id' => $instructor->id,
                ])->value('improvements');

                return [
                    'instructor_id'   => $instructor->id,
                    'instructor_name' => trim(($instructor->first_name ?? '') . ' ' . ($instructor->last_name ?? '')),
                    'pc_submissions'  => $pcSubmissions,
                    'improvements'    => $improvement,
                ];
            });

            return response()->json([
                'id'                 => $offering->id,
                'course_code'        => $offering->course->course_code ?? null,
                'course_name'        => $offering->course->course_name ?? null,
                'semester'           => $offering->semester,
                'campus'             => $offering->campus->campus_name ?? null,
                'coordinator_name'   => $offering->coordinator
                    ? trim(($offering->coordinator->first_name ?? '') . ' ' . ($offering->coordinator->last_name ?? ''))
                    : null,
                'grade_distribution' => $gradeDistribution,
                'instructors'        => $instructorData,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error fetching offering detail.', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy(CourseOffering $courseOffering)
    {
        try{
            $courseOffering->delete();
            return response()->json(['message' => 'Course offering deleted successfully.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error deleting course offering.', 'error' => $e->getMessage()], 500);
        }

    }
}
