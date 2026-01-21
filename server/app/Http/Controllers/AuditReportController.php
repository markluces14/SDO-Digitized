<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class AuditReportController extends Controller
{
    public function pdf(Request $request)
    {
        // ✅ THIS IS WHERE YOUR LINE GOES
        $logs = AuditLog::with([
            'user',
            'employee',
            'document.employee'
        ])
            ->latest()
            ->get();

        $meta = [
            'generated_at' => Carbon::now()->format('F d, Y h:i A'),
            'generated_by' => optional($request->user())->name ?? 'System',
            'count'        => $logs->count(),
        ];

        $pdf = Pdf::loadView('reports.audit', [
            'logs' => $logs,
            'meta' => $meta,
        ])->setPaper('a4', 'portrait');

        return $pdf->stream(
            'audit-report-' . now()->format('Ymd-His') . '.pdf'
        );
    }
}
