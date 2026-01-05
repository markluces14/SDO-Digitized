<?php

namespace App\Console\Commands;

use App\Models\Document;
use App\Models\Notification;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;

class NotifyExpiringDocuments extends Command
{
    protected $signature = 'docs:notify-expiring {--days=30}';
    protected $description = 'Create notifications for documents expiring soon';

    public function handle(): int
    {
        $days = (int) $this->option('days');
        $today = Carbon::today();
        $until = Carbon::today()->addDays($days);

        // Documents expiring in next N days (not soft-deleted)
        $docs = Document::query()
            ->whereNull('deleted_at')
            ->whereNotNull('expires_at')
            ->whereBetween('expires_at', [$today, $until])
            ->get();

        $count = 0;

        foreach ($docs as $doc) {
            // Find employee user for that employee_id
            $u = User::where('employee_id', $doc->employee_id)
                ->where('role', 'employee')
                ->first();

            if (!$u) continue;

            $title = "Document expiring soon: {$doc->title}";

            // Avoid duplicates
            $exists = Notification::where('user_id', $u->id)
                ->where('type', 'doc_expiring')
                ->where('title', $title)
                ->exists();

            if ($exists) continue;

            Notification::create([
                'user_id' => $u->id,
                'type' => 'doc_expiring',
                'title' => $title,
                'message' => "Your document will expire on " . Carbon::parse($doc->expires_at)->format('M d, Y') . ".",
                'data' => [
                    'document_id' => $doc->id,
                    'employee_id' => $doc->employee_id,
                    'expires_at' => (string) $doc->expires_at,
                ],
            ]);

            $count++;
        }

        $this->info("Created {$count} notification(s).");
        return self::SUCCESS;
    }
}
