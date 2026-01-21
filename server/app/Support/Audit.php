<?php
// app/Support/Audit.php
// app/Support/Audit.php (or inside a trait)
namespace App\Support;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class Audit
{
    public static function log(Request $r, string $action, ?int $documentId = null, ?int $employeeId = null, ?string $message = null): void
    {
        AuditLog::create([
            'user_id'    => optional($r->user())->id,
            'action'     => $action,
            'document_id' => $documentId,
            'employee_id' => $employeeId,
            'ip'         => $r->ip(),
            'message'    => $message,
        ]);
    }
}
