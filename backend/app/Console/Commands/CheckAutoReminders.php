<?php

namespace App\Console\Commands;

use App\Jobs\SendEndSemesterReminder;
use App\Jobs\SendMidSemesterReminder;
use App\Jobs\SendStartSemesterReminder;
use App\Models\AutoReminder;
use Carbon\Carbon;
use Illuminate\Console\Command;

class CheckAutoReminders extends Command
{
    protected $signature   = 'reminders:check';
    protected $description = 'Check auto-reminder settings and dispatch semester reminder emails on the correct dates.';

    public function handle(): void
    {
        $record = AutoReminder::first();

        if (!$record) {
            $this->info('No auto-reminder settings found.');
            return;
        }

        $today = Carbon::today();

        // Start of semester
        if ($record->first && $record->first_date) {
            $firstDate = Carbon::parse($record->first_date)->startOfDay();
            if ($today->equalTo($firstDate)) {
                SendStartSemesterReminder::dispatch();
                $this->info('Dispatched SendStartSemesterReminder.');
            }
        }

        // Middle of semester
        if ($record->middle && $record->middle_date) {
            $middleDate = Carbon::parse($record->middle_date)->startOfDay();
            if ($today->equalTo($middleDate)) {
                SendMidSemesterReminder::dispatchSync();
                $this->info('Dispatched SendMidSemesterReminder.');
            }
        }

        // End of semester — send daily for the 10 days leading up to (and including) the end date
        if ($record->end && $record->end_date) {
            $endDate   = Carbon::parse($record->end_date)->startOfDay();
            $startFrom = $endDate->copy()->subDays(9);

            if ($today->between($startFrom, $endDate)) {
                SendEndSemesterReminder::dispatch();
                $this->info('Dispatched SendEndSemesterReminder.');
            }
        }

        $this->info('Auto-reminder check complete.');
    }
}
