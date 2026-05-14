<?php

namespace App\Http\Controllers;

use App\Models\AssessmentMethod;
use App\Models\Course;
use App\Models\CourseOffering;
use App\Models\CourseOfferingInstructorImprovement;
use App\Models\CourseOfferingSubmissionGrade;
use App\Models\InstructorAssignmentPcSubmission;
use App\Models\Report;
use App\Models\So;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ReportController extends Controller
{
    public function index()
    {
        $reports = Report::orderBy('generated_at', 'desc')->get()->map(function ($r) {
            $startY = explode('-', $r->start_academic_year)[0] ?? $r->start_academic_year;
            $endY   = explode('-', $r->end_academic_year)[1]   ?? $r->end_academic_year;
            return [
                'id'                  => $r->id,
                'name'                => "Course Assessment Report ({$startY}-{$endY})",
                'start_academic_year' => $r->start_academic_year,
                'end_academic_year'   => $r->end_academic_year,
                'generated_at'        => $r->generated_at,
            ];
        });

        return response()->json($reports);
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'year_range' => 'required|string',
            ]);

            $yearRange     = $request->year_range;                    // e.g. "2024-2026"
            $academicYears = $this->parseYearRange($yearRange);       // ["2024-2025","2025-2026"]
            $data          = $this->buildReportData($yearRange);

            $pdf = Pdf::loadView('reports.report', [
                'academicYear' => $yearRange,
                'generatedAt'  => now()->format('F j, Y H:i'),
                'data'         => $data,
            ])->setPaper('a4', 'portrait');

            $filename = 'reports/report_' . time() . '.pdf';
            Storage::disk('public')->put($filename, $pdf->output());

            $report = Report::create([
                'start_academic_year' => $academicYears[0],
                'end_academic_year'   => end($academicYears),
                'generated_at'        => now(),
                'report_path'         => $filename,
            ]);

            $startY = explode('-', $report->start_academic_year)[0];
            $endY   = explode('-', $report->end_academic_year)[1];

            return response()->json([
                'id'                  => $report->id,
                'name'                => "Course Assessment Report ({$startY}-{$endY})",
                'start_academic_year' => $report->start_academic_year,
                'end_academic_year'   => $report->end_academic_year,
                'generated_at'        => $report->generated_at,
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error generating report.', 'error' => $e->getMessage()], 500);
        }
    }

    public function download(Report $report)
    {
        $path = storage_path('app/public/' . $report->report_path);

        if (!file_exists($path)) {
            return response()->json(['message' => 'Report file not found.'], 404);
        }

        return response()->download($path, "report_{$report->id}.pdf", [
            'Content-Type' => 'application/pdf',
        ]);
    }

    public function viewPdf(Report $report)
    {
        $path = storage_path('app/public/' . $report->report_path);

        if (!file_exists($path)) {
            return response()->json(['message' => 'Report file not found.'], 404);
        }

        return response()->file($path, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline',
        ]);
    }

    public function getStats()
    {
        try {
            $submissions = InstructorAssignmentPcSubmission::with([
                'formAssignment.offering.course',
                'formAssignmentPc.pc.so',
            ])->get();

            $distinctYears = CourseOffering::distinct()->pluck('academic_year')
                ->filter()->sort()->values();

            $yearStarts = $distinctYears->map(fn($y) => (int) explode('-', $y)[0])->sort()->values();

            $yearRanges = [];
            for ($i = 0; $i < $yearStarts->count() - 1; $i++) {
                if ($yearStarts[$i + 1] - $yearStarts[$i] === 1) {
                    $yearRanges[] = $yearStarts[$i] . '-' . ($yearStarts[$i + 1] + 1);
                }
            }
            if (empty($yearRanges) && $yearStarts->count() === 1) {
                $y = $yearStarts[0];
                $yearRanges[] = $y . '-' . ($y + 2);
            }

            if ($submissions->isEmpty()) {
                return response()->json([
                    'total_courses'      => 0,
                    'average_score'      => 0,
                    'best_course'        => null,
                    'worst_course'       => null,
                    'below_expectations' => [],
                    'so_by_year'         => ['labels' => [], 'so_data' => []],
                    'academic_years'     => $yearRanges,
                ]);
            }

            // Per-course averages
            $byCourse = $submissions->groupBy(
                fn($s) => $s->formAssignment?->offering?->course?->course_code ?? 'Unknown'
            );

            $courseAvgs = $byCourse->map(
                fn($g) => round($g->avg('percentage_of_students_meeting_performance_standard'), 1)
            );

            $total_courses  = $courseAvgs->count();
            $average_score  = round($submissions->avg('percentage_of_students_meeting_performance_standard'), 1);
            $bestKey        = $courseAvgs->sortDesc()->keys()->first();
            $worstKey       = $courseAvgs->sort()->keys()->first();
            $best_course    = ['course_code' => $bestKey,  'percentage' => $courseAvgs[$bestKey]];
            $worst_course   = ['course_code' => $worstKey, 'percentage' => $courseAvgs[$worstKey]];

            // Below expectations (< 70%)
            $below = $submissions
                ->filter(fn($s) => $s->percentage_of_students_meeting_performance_standard < 70)
                ->map(fn($s) => [
                    'course_code' => $s->formAssignment?->offering?->course?->course_code ?? '-',
                    'so_code'     => $s->formAssignmentPc?->pc?->so?->so_code ?? '-',
                    'pc_code'     => $s->formAssignmentPc?->pc?->pc_code ?? '-',
                    'percentage'  => $s->percentage_of_students_meeting_performance_standard,
                    'comment'     => $s->comment ?? '',
                ])
                ->sortBy('percentage')
                ->values();

            // SO averages grouped by academic year
            $byYear = $submissions->groupBy(
                fn($s) => $s->formAssignment?->offering?->academic_year ?? 'Unknown'
            );

            $soKeys = $submissions
                ->pluck('formAssignmentPc.pc.so.so_code')
                ->filter()
                ->unique()
                ->sort()
                ->values();

            $labels = $byYear->keys()->sort()->values();

            $soData = [];
            foreach ($soKeys as $soCode) {
                $soData[$soCode] = $labels->map(function ($year) use ($byYear, $soCode) {
                    $yearGroup = $byYear[$year] ?? collect();
                    $soGroup   = $yearGroup->filter(
                        fn($s) => ($s->formAssignmentPc?->pc?->so?->so_code ?? '') === $soCode
                    );
                    return $soGroup->isNotEmpty()
                        ? round($soGroup->avg('percentage_of_students_meeting_performance_standard'), 1)
                        : null;
                })->values()->toArray();
            }

            return response()->json([
                'total_courses'      => $total_courses,
                'average_score'      => $average_score,
                'best_course'        => $best_course,
                'worst_course'       => $worst_course,
                'below_expectations' => $below,
                'so_by_year'         => ['labels' => $labels->toArray(), 'so_data' => $soData],
                'academic_years'     => $yearRanges,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error fetching stats.', 'error' => $e->getMessage()], 500);
        }
    }

    private function buildReportData(string $yearRange): array
    {
        $academicYears = $this->parseYearRange($yearRange);

        // Offerings for both academic years in the range
        $offerings = CourseOffering::whereIn('academic_year', $academicYears)
            ->with(['course', 'campus', 'instructors'])
            ->get();

        $offeringIds = $offerings->pluck('id');

        // All assessment methods & courses (for checkboxes)
        $allMethods = AssessmentMethod::orderBy('method_name')->get(['id', 'method_name']);
        $allCourses = Course::orderBy('course_code')->get(['id', 'course_code']);

        // All PC submissions for these offerings
        $pcSubmissions = InstructorAssignmentPcSubmission::whereHas(
            'formAssignment', fn($q) => $q->whereIn('offering_id', $offeringIds)
        )->with([
            'formAssignment.offering.course',
            'formAssignment.offering.campus',
            'formAssignment.offering',
            'formAssignmentPc.pc.so',
            'assessmentMethod',
            'instructor',
        ])->get();

        // Methods and courses actually used
        $methodsUsed     = $pcSubmissions->pluck('assessmentMethod.method_name')->filter()->unique()->flip()->toArray();
        $coursesWithSubs = $pcSubmissions->map(fn($s) => $s->formAssignment?->offering?->course?->course_code)->filter()->unique()->flip()->toArray();

        // Semesters and campuses from offerings
        $semesters = $offerings->pluck('semester')->filter()->unique()->sort()->values();
        $campuses  = $offerings->map(fn($o) => $o->campus?->campus_name)->filter()->unique()->sort()->values();

        // Only SOs that were actually assessed (appear in PC submissions)
        $assessedSoCodes = $pcSubmissions
            ->pluck('formAssignmentPc.pc.so.so_code')
            ->filter()->unique()->sort()->values();

        $soList = So::whereIn('so_code', $assessedSoCodes)
            ->orderBy('so_code')
            ->get(['so_code', 'description']);

        // Grade distributions (for nb_of_students)
        $grades = CourseOfferingSubmissionGrade::whereIn('offering_id', $offeringIds)->get()->keyBy('offering_id');

        // Instructor-level improvements
        $improvements = CourseOfferingInstructorImprovement::whereIn('offering_id', $offeringIds)
            ->with(['instructor', 'offering.course'])
            ->get();

        // Build report rows grouped by (instructor_id, offering_id)
        $grouped = $pcSubmissions->groupBy(fn($s) => $s->instructor_id . '_' . $s->formAssignment?->offering_id);

        $reportRows = $grouped->map(function ($subs) use ($grades) {
            $first      = $subs->first();
            $offering   = $first->formAssignment?->offering;
            $instructor = $first->instructor;
            $offeringId = $offering?->id;

            // nb_of_students from grade distribution totals
            $gradeRec   = $grades[$offeringId] ?? null;
            $nbStudents = null;
            if ($gradeRec) {
                $total = collect(['a','a_minus','b_plus','b','b_minus','c_plus','c','c_minus','d_plus','d','f','w','i'])
                    ->sum(fn($k) => $gradeRec->$k ?? 0);
                if ($total > 0) $nbStudents = $total;
            }

            // Group by SO
            $byso = $subs->groupBy(fn($s) => $s->formAssignmentPc?->pc?->so?->so_code ?? 'Unknown');

            $sloData = $byso->map(function ($soSubs, $soCode) {
                $soDesc = $soSubs->first()?->formAssignmentPc?->pc?->so?->description ?? '';
                $pcs = $soSubs->map(fn($s) => [
                    'pc_code'             => $s->formAssignmentPc?->pc?->pc_code ?? '-',
                    'description'         => $s->formAssignmentPc?->pc?->description ?? '-',
                    'score'               => $s->average_score,
                    'percent'             => $s->percentage_of_students_meeting_performance_standard,
                    'performance_standard'=> $s->performance_standard ?? 70,
                    'methods'             => $s->assessmentMethod?->method_name ? [$s->assessmentMethod->method_name] : [],
                    'comment'             => $s->comment ?? null,
                ])->values()->toArray();

                return ['description' => $soDesc, 'pcs' => $pcs];
            })->toArray();

            return [
                'meta' => [
                    'course_code'    => $offering?->course?->course_code ?? '-',
                    'instructor'     => trim(($instructor?->first_name ?? '') . ' ' . ($instructor?->last_name ?? '')),
                    'semester'       => $offering?->semester ?? '-',
                    'nb_of_students' => $nbStudents,
                ],
                'slos' => $sloData,
            ];
        })->values()->toArray();

        // Section V improvement rows (per PC, using comment field)
        $improvementRows = [];
        foreach ($reportRows as $row) {
            foreach ($row['slos'] as $soCode => $so) {
                foreach ($so['pcs'] as $pc) {
                    $improvementRows[] = [
                        'pc_code'     => $pc['pc_code'],
                        'description' => $pc['description'],
                        'course_code' => $row['meta']['course_code'],
                        'instructor'  => $row['meta']['instructor'],
                        'semester'    => $row['meta']['semester'],
                        'text'        => $pc['comment'],
                    ];
                }
            }
        }

        // Instructor-level improvement notes (from CourseOfferingInstructorImprovement)
        $instructorImprovements = $improvements->map(fn($i) => [
            'instructor'  => trim(($i->instructor?->first_name ?? '') . ' ' . ($i->instructor?->last_name ?? '')),
            'course_code' => $i->offering?->course?->course_code ?? '-',
            'course_name' => $i->offering?->course?->course_name ?? '-',
            'semester'    => $i->offering?->semester ?? '-',
            'text'        => $i->improvements ?? null,
        ])->filter(fn($i) => !empty($i['text']))->values()->toArray();

        return [
            'semesters'               => $semesters->toArray(),
            'campuses'                => $campuses->toArray(),
            'all_methods'             => $allMethods->map(fn($m) => ['id' => $m->id, 'name' => $m->method_name])->toArray(),
            'methods_used'            => $methodsUsed,
            'all_courses'             => $allCourses->map(fn($c) => $c->course_code)->toArray(),
            'courses_with_subs'       => $coursesWithSubs,
            'so_list'                 => $soList->map(fn($s) => ['code' => $s->so_code, 'description' => $s->description])->toArray(),
            'report_rows'             => $reportRows,
            'improvement_rows'        => $improvementRows,
            'instructor_improvements' => $instructorImprovements,
        ];
    }

    private function parseYearRange(string $yearRange): array
    {
        // "2024-2026" → ["2024-2025", "2025-2026"]
        $parts     = explode('-', $yearRange);
        $startYear = (int) $parts[0];
        $endYear   = (int) $parts[1];
        $years = [];
        for ($y = $startYear; $y < $endYear; $y++) {
            $years[] = $y . '-' . ($y + 1);
        }
        return $years ?: [$yearRange];
    }
}
