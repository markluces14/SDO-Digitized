<?php

namespace App\Http\Controllers;

use App\Models\Feedback;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FeedbackController extends Controller
{
    public function store(Request $r)
    {
        $u = $r->user();

        $data = $r->validate([
            'subject' => ['required', 'string', 'max:100'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        Feedback::create([
            'user_id' => $u?->id,
            'subject' => $data['subject'],
            'message' => $data['message'],
            'status'  => 'open',
        ]);

        return response()->json(['message' => 'Feedback sent.'], 201);
    }

    // (Optional for later)
    public function index(Request $r)
    {
        $u = $r->user();
        if (!in_array(strtolower($u?->role), ['admin', 'staff'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $q = $r->query('q');

        $rows = Feedback::with('user')
            ->when(
                $q,
                fn($qq) =>
                $qq->where('subject', 'like', "%$q%")
                    ->orWhere('message', 'like', "%$q%")
            )
            ->latest()
            ->paginate(25);

        return response()->json($rows);
    }
    public function updateStatus(Request $request, Feedback $feedback)
    {
        // admin/staff only
        $role = strtolower(Auth::user()->role ?? '');
        if (!in_array($role, ['admin', 'staff'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $data = $request->validate([
            'status' => 'required|in:open,resolved',
        ]);

        $feedback->status = $data['status'];

        if ($data['status'] === 'resolved') {
            $feedback->resolved_at = now();
            $feedback->resolved_by = Auth::id();
        } else {
            $feedback->resolved_at = null;
            $feedback->resolved_by = null;
        }

        $feedback->save();

        return response()->json(['ok' => true, 'status' => $feedback->status]);
    }
}
