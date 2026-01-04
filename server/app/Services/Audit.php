<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

class Audit
{
    /**
     * @param string $action  e.g. 'document.uploaded'
     * @param array  $meta    free-form context
     * @param mixed  $entity  Eloquent model (optional)
     * @param ?Request $req
     */
    public static function log(string $action, array $meta = [], $entity = null, ?Request $req = null): AuditLog
    {
        $req ??= request();

        return AuditLog::create([
            'action'      => $action,
            'user_id'     => Auth::id(),
            'ip'          => $req?->ip(),
            'entity_type' => $entity ? get_class($entity) : null,
            'entity_id'   => $entity?->id,
            'meta'        => $meta,
        ]);
    }
}
