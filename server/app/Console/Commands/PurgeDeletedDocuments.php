<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use App\Models\Document;

class PurgeDeletedDocuments extends Command
{
    protected $signature = 'documents:purge {--days=30 : Days to keep soft-deleted documents}';
    protected $description = 'Permanently delete documents soft-deleted more than N days ago (and delete stored files).';

    public function handle(): int
    {
        $days = (int) $this->option('days');
        $cutoff = now()->subDays($days);

        $docs = Document::onlyTrashed()
            ->where('deleted_at', '<=', $cutoff)
            ->get();

        $count = 0;

        foreach ($docs as $doc) {
            if ($doc->path && Storage::disk('local')->exists($doc->path)) {
                Storage::disk('local')->delete($doc->path);
            }

            $doc->forceDelete();
            $count++;
        }

        $this->info("Purged {$count} documents (older than {$days} days).");
        return self::SUCCESS;
    }
}
