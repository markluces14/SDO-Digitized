<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $fillable = [
        'user_id',
        'action',
        'document_id',
        'employee_id',
        'ip',
        'message',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // ✅ include trashed documents (soft-deleted)
    public function document()
    {
        return $this->belongsTo(Document::class)->withTrashed();
    }

    // ✅ document owner (recommended source)
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
