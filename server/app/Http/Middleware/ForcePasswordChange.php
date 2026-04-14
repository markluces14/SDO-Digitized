<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ForcePasswordChange
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user && $user->must_change_password) {
            // allow only these routes while forced
            if (
                !$request->routeIs('password.force.form') &&
                !$request->routeIs('password.force.update') &&
                !$request->routeIs('logout')
            ) {
                return redirect()->route('password.force.form');
            }
        }

        return $next($request);
    }
}
