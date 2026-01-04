<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Document extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'employee_id',
        'document_type_id',
        'title',
        'path',
        'hash',
        'issued_at',
        'expires_at',
        'status',
        'metadata',
        'uploaded_by'
    ];
    protected $casts = ['metadata' => 'array', 'issued_at' => 'date', 'expires_at' => 'date'];
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
    public function type()
    {
        return $this->belongsTo(DocumentType::class, 'document_type_id');
    }
    public function tags()
    {
        return $this->belongsToMany(Tag::class);
    }
}
