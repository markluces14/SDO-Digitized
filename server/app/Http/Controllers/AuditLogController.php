<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $r)
    {
        // Only admin/staff (adjust to your roles)
        abort_unless(in_array(optional($r->user())->role, ['admin', 'staff']), 403);

        // ✅ Eager load everything needed by UI (including document owner)
        $q = AuditLog::with([
            'user',
            'employee',          // owner from audit_logs.employee_id
            'document.employee', // fallback owner from document->employee
        ])->latest();

        // ✅ Filters used by your UI
        if ($r->filled('action')) {
            $q->where('action', $r->action);
        }

        if ($r->filled('from')) {
            $q->whereDate('created_at', '>=', $r->from);
        }

        if ($r->filled('to')) {
            $q->whereDate('created_at', '<=', $r->to);
        }

        /**
         * ✅ "user" filter (name/email typed in modal)
         * Your UI sends: user=<string>
         */
        if ($r->filled('user')) {
            $term = '%' . $r->user . '%';
            $q->whereHas('user', function ($u) use ($term) {
                $u->where('name', 'like', $term)
                    ->orWhere('email', 'like', $term);
            });
        }

        /**
         * ✅ "document" filter (title OR numeric id typed in modal)
         * Your UI sends: document=<string>
         */
        if ($r->filled('document')) {
            $docTerm = trim((string) $r->document);
            $q->where(function ($x) use ($docTerm) {
                if (is_numeric($docTerm)) {
                    $x->orWhere('document_id', (int) $docTerm);
                }
                $x->orWhereHas('document', function ($d) use ($docTerm) {
                    $d->where('title', 'like', '%' . $docTerm . '%');
                });
            });
        }

        /**
         * ✅ Global quick search (top search box)
         * Your UI sends: q=<string>
         */
        if ($r->filled('q')) {
            $term = '%' . $r->q . '%';
            $q->where(function ($x) use ($term) {
                $x->where('action', 'like', $term)
                    ->orWhere('message', 'like', $term)
                    ->orWhere('ip', 'like', $term)
                    ->orWhereHas('user', fn($u) => $u->where('name', 'like', $term)->orWhere('email', 'like', $term))
                    ->orWhereHas('employee', fn($e) => $e->where('last_name', 'like', $term)->orWhere('first_name', 'like', $term))
                    ->orWhereHas('document', fn($d) => $d->where('title', 'like', $term));
            });
        }

        // ✅ Return the SAME query we built (NOT a different $logs variable)
        return $q->paginate(20);
    }
}
