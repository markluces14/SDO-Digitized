<?php
// app/Support/Audit.php
namespace App\Support;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class Audit
{
    public static function log(Request $r, string $action, array $data = []): void
    {
        AuditLog::create([
            'user_id'    => optional($r->user())->id,
            'action'     => $action,
            'employee_id' => $data['employee_id'] ?? null,
            'document_id' => $data['document_id'] ?? null,
            'ip'         => $r->ip(),
            'user_agent' => substr((string)$r->userAgent(), 0, 1000),
            'meta'       => $data['meta'] ?? null,
        ]);
    }
}
