<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $r)
    {
        $u = $r->user();

        $items = Notification::where('user_id', $u->id)
            ->orderByDesc('id')
            ->limit(30)
            ->get();

        $unread = Notification::where('user_id', $u->id)
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'unread' => $unread,
            'data' => $items,
        ]);
    }

    public function read(Request $r, Notification $notification)
    {
        $u = $r->user();
        if ($notification->user_id !== $u->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $notification->read_at = now();
        $notification->save();

        return response()->json(['ok' => true]);
    }

    public function readAll(Request $r)
    {
        $u = $r->user();
        Notification::where('user_id', $u->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['ok' => true]);
    }
}
