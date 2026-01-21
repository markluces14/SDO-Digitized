<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function employeesPdf(Request $r)
    {
        // Optional: lock this to admin/staff only
        $user = $r->user();
        if ($user?->role === 'employee') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $r->validate([
            'department' => ['nullable', 'string', 'max:255'],
            'position'   => ['nullable', 'string', 'max:100'],
            'years_min'  => ['nullable', 'integer', 'min:0', 'max:80'],
            'years_max'  => ['nullable', 'integer', 'min:0', 'max:80'],
            'q'          => ['nullable', 'string', 'max:255'],
            'sort'       => ['nullable', 'in:name,date_hired,department,position,employee_no'],
            'dir'        => ['nullable', 'in:asc,desc'],
        ]);

        $department = $validated['department'] ?? null;
        $position   = $validated['position'] ?? null;
        $yearsMin   = $validated['years_min'] ?? null;
        $yearsMax   = $validated['years_max'] ?? null;
        $q          = $validated['q'] ?? null;
        $sort       = $validated['sort'] ?? 'name';
        $dir        = $validated['dir'] ?? 'asc';

        $query = Employee::query();

        if ($department) {
            $query->where('department', $department);
        }
        if ($position) {
            $query->where('position', $position);
        }
        if ($q) {
            $query->where(function ($qq) use ($q) {
                $qq->where('first_name', 'like', "%{$q}%")
                    ->orWhere('last_name', 'like', "%{$q}%")
                    ->orWhere('employee_no', 'like', "%{$q}%")
                    ->orWhere('department', 'like', "%{$q}%")
                    ->orWhere('position', 'like', "%{$q}%");
            });
        }

        // Years of employment filter (computed from date_hired)
        // years >= yearsMin  => date_hired <= today - yearsMin years
        // years <= yearsMax  => date_hired >= today - yearsMax years
        $today = Carbon::today();
        if ($yearsMin !== null) {
            $query->whereDate('date_hired', '<=', $today->copy()->subYears($yearsMin));
        }
        if ($yearsMax !== null) {
            $query->whereDate('date_hired', '>=', $today->copy()->subYears($yearsMax));
        }

        // sorting
        if ($sort === 'name') {
            $query->orderBy('last_name', $dir)->orderBy('first_name', $dir);
        } elseif ($sort === 'date_hired') {
            $query->orderBy('date_hired', $dir);
        } else {
            $query->orderBy($sort, $dir);
        }

        $employees = $query->get();

        $rows = $employees->map(function ($e) {
            $hired = $e->date_hired ? Carbon::parse($e->date_hired) : null;
            $years = $hired ? $hired->diffInYears(Carbon::today()) : null;

            return [
                'employee_no' => $e->employee_no,
                'name'        => trim(($e->last_name ?? '') . ', ' . ($e->first_name ?? '') . ' ' . ($e->middle_name ?? '')),
                'position'    => $e->position,
                'department'  => $e->department,
                'date_hired'  => $hired ? $hired->format('F d, Y') : '—',
                'years'       => $years !== null ? $years : '—',
            ];
        });

        $meta = [
            'generated_at' => now()->format('F d, Y h:i A'),
            'filters' => [
                'department' => $department ?: 'All',
                'position'   => $position ?: 'All',
                'years'      => ($yearsMin !== null || $yearsMax !== null)
                    ? (($yearsMin ?? 0) . ' - ' . ($yearsMax ?? '∞'))
                    : 'All',
                'q'          => $q ?: '—',
            ],
            'count' => $rows->count(),
        ];

        $pdf = Pdf::loadView('reports.employees', [
            'rows' => $rows,
            'meta' => $meta,
        ])->setPaper('a4', 'landscape');

        $filename = 'employees-report-' . now()->format('Ymd-His') . '.pdf';

        return $pdf->download($filename);
    }
}
