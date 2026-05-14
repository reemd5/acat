<?php

namespace App\Helpers;

use App\Models\Notification;
use App\Models\Role;
use Illuminate\Support\Facades\Log;

class NotificationHelper
{
    public static function notify(int $userId, string $text, string $semester): void
    {
        try {
            Notification::create([
                'user_id'  => $userId,
                'text'     => $text,
                'date'     => now(),
                'semester' => $semester,
            ]);
        } catch (\Throwable $e) {
            Log::error('NotificationHelper::notify failed', [
                'user_id'  => $userId,
                'text'     => $text,
                'semester' => $semester,
                'error'    => $e->getMessage(),
            ]);
        }
    }

    public static function notifyAdmins(string $text, string $semester): void
    {
        try {
            $adminUserIds = Role::where('role_name', 'admin')
                ->first()
                ?->users()
                ->pluck('users.id') ?? collect();

            foreach ($adminUserIds as $userId) {
                self::notify($userId, $text, $semester);
            }
        } catch (\Throwable $e) {
            Log::error('NotificationHelper::notifyAdmins failed', [
                'text'    => $text,
                'error'   => $e->getMessage(),
            ]);
        }
    }
}
