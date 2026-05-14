<?php

use App\Http\Controllers\AssessmentMethodController;
use App\Http\Controllers\CampusController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseOfferingController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\FormAssignmentController;
use App\Http\Controllers\FormController;
use App\Http\Controllers\PcController;
use App\Http\Controllers\AutoReminderController;
use App\Http\Controllers\CustomReminderController;
use App\Http\Controllers\ReminderController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\SoController;
use App\Http\Controllers\SubmissionController;
use App\Http\Controllers\SubmissionGradeDistributionController;
use App\Http\Controllers\SubmissionImprovementController;
use App\Http\Controllers\SubmissionValueController;
use App\Http\Controllers\InstructorAssignmentController;
use App\Http\Controllers\InstructorAssignmentPcSubmissionController;
use App\Http\Controllers\CourseOfferingSubmissionGradeController;
use App\Http\Controllers\CourseOfferingInstructorImprovementController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmailController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

// Dashboard stats
Route::get('/total-forms', [DashboardController::class, 'getTotalForms']);
Route::get('/pending-forms', [DashboardController::class, 'getPendingForms']);
Route::get('/auto-reminders', [AutoReminderController::class, 'index']);
Route::put('/auto-reminders', [AutoReminderController::class, 'update']);
Route::get('/custom-reminders', [CustomReminderController::class, 'index']);
Route::put('/custom-reminders', [CustomReminderController::class, 'update']);
Route::get('/total-reminders', [DashboardController::class, 'getTotalReminders']);
Route::get('/reminder_overview', [DashboardController::class, 'getReminderOverview']);
Route::get('/instructors-form-completion-stats', [DashboardController::class, 'getFormCompletionStats']);
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/notifications', [DashboardController::class, 'getNotifications']);
    Route::post('/notifications', [DashboardController::class, 'storeNotification']);
    Route::delete('/notifications/{id}', [DashboardController::class, 'deleteNotification']);
});


Route::apiResource('assignments', FormAssignmentController::class);
Route::apiResource('users', UserController::class);
Route::patch('/users/{id}/password', [UserController::class, 'updatePassword']);
Route::apiResource('roles', RoleController::class);
Route::apiResource('campuses', CampusController::class);
Route::apiResource('departments', DepartmentController::class);
Route::apiResource('reminders', ReminderController::class);
Route::apiResource('courses', CourseController::class);
Route::apiResource('course-offerings', CourseOfferingController::class);
Route::apiResource('sos', SoController::class);
Route::apiResource('pcs', PcController::class);
Route::apiResource('assessment-methods', AssessmentMethodController::class);
Route::apiResource('forms', FormController::class);
Route::apiResource('form-assignments', FormAssignmentController::class);
Route::apiResource('submissions', SubmissionController::class);
Route::apiResource('submission-values', SubmissionValueController::class);
Route::apiResource('submission-grade-distributions', SubmissionGradeDistributionController::class);
Route::apiResource('submission-improvements', SubmissionImprovementController::class);
Route::apiResource('settings', SettingController::class);
Route::apiResource('reports', ReportController::class);
Route::get('/report-stats', [ReportController::class, 'getStats']);
Route::get('/reports/{report}/download', [ReportController::class, 'download']);
Route::get('/reports/{report}/view', [ReportController::class, 'viewPdf']);

Route::get('instructor/assignments', [InstructorAssignmentController::class, 'index'])->middleware('auth:sanctum');
Route::get('instructor/assignments', [InstructorAssignmentController::class, 'index'])->middleware('auth:sanctum');
Route::get('/instructor/offerings', [CourseOfferingController::class, 'getInstructorOfferings'])->middleware('auth:sanctum');
Route::patch('/course-offerings/{courseOffering}/coordinator', [CourseOfferingController::class, 'updateCoordinator']);
Route::get('/instructor-assignment-pc-submissions', [InstructorAssignmentPcSubmissionController::class, 'index']);
Route::post('/instructor-assignment-pc-submissions', [InstructorAssignmentPcSubmissionController::class, 'store']);
Route::get('/course-offering-submission-grades', [CourseOfferingSubmissionGradeController::class, 'show']);
Route::post('/course-offering-submission-grades', [CourseOfferingSubmissionGradeController::class, 'store']);
Route::get('/course-offering-instructor-improvements', [CourseOfferingInstructorImprovementController::class, 'show']);
Route::post('/course-offering-instructor-improvements', [CourseOfferingInstructorImprovementController::class, 'store']);
Route::get('/admin-offering-detail/{id}', [CourseOfferingController::class, 'getAdminOfferingDetail']);
Route::post('/course-offerings/{offeringId}/instructor-submit', [CourseOfferingController::class, 'submitInstructorForm']);
Route::get('/coordinator-improvements', [CourseOfferingInstructorImprovementController::class, 'getCoordinatorImprovements'])->middleware('auth:sanctum');
Route::get('/coordinator-improvements/{id}', [CourseOfferingInstructorImprovementController::class, 'showDetail'])->middleware('auth:sanctum');
Route::get('/coordinator-dashboard-stats', [CourseOfferingInstructorImprovementController::class, 'getDashboardStats'])->middleware('auth:sanctum');
Route::get('/coordinator-comparison', [CourseOfferingInstructorImprovementController::class, 'getCoordinatorComparison'])->middleware('auth:sanctum');

Route::post('/send-email', [EmailController::class, 'send'])
    ->middleware('auth:sanctum');