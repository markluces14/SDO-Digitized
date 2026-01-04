<?php

// app/Http/Controllers/AuditLogController.php
namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $r)
    {
        // Only admin/staff (adjust to your roles)
        abort_unless(in_array(optional($r->user())->role, ['admin', 'staff']), 403);

        $q = AuditLog::with(['user', 'employee', 'document'])->latest();

        if ($r->filled('action')) $q->where('action', $r->action);
        if ($r->filled('user_id')) $q->where('user_id', $r->user_id);
        if ($r->filled('employee_id')) $q->where('employee_id', $r->employee_id);
        if ($r->filled('document_id')) $q->where('document_id', $r->document_id);

        if ($r->filled('from')) $q->whereDate('created_at', '>=', $r->from);
        if ($r->filled('to')) $q->whereDate('created_at', '<=', $r->to);

        if ($r->filled('q')) {
            $term = '%' . $r->q . '%';
            $q->where(function ($x) use ($term) {
                $x->whereHas('user', fn($u) => $u->where('name', 'like', $term)->orWhere('email', 'like', $term))
                    ->orWhereHas('employee', fn($e) => $e->where('last_name', 'like', $term)->orWhere('first_name', 'like', $term))
                    ->orWhereHas('document', fn($d) => $d->where('title', 'like', $term));
            });
        }

        return $q->paginate(30);
    }
}
