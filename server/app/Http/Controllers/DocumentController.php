<?php

namespace App\Http\Controllers;

use App\Models\{Document, Employee, Tag};
use Illuminate\Http\Request;
use App\Http\Requests\StoreDocumentRequest;
use Illuminate\Support\Facades\{Auth, Storage, File};
use App\Support\Audit;

class DocumentController extends Controller
{
    private string $disk = 'local';

    private function ensureEmployeeOwns(Request $r, int $employeeId): void
    {
        $u = $r->user();
        if ($u && $u->role === 'employee') {
            abort_if((int)optional($u->employee)->id !== (int)$employeeId, 403);
        }
    }

    /**
     * Upload a document (employees limited to own).
     */
    public function store(StoreDocumentRequest $r)
    {
        $user = $r->user();
        $employeeId = (int)$r->input('employee_id');

        $this->ensureEmployeeOwns($r, $employeeId);

        if ($user?->role === 'employee' && (int)$user->employee_id !== $employeeId) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $file = $r->file('file');

        // IMPORTANT: store on consistent disk
        $path = $file->store("documents/{$employeeId}", $this->disk);
        $hash = hash_file('sha256', $file->getRealPath());

        $doc = Document::create([
            'employee_id' => $employeeId,
            'title'       => (string)$r->input('title'),
            'path'        => $path,
            'hash'        => $hash,
            'issued_at'   => $r->input('issued_at') ?: null,
            'expires_at'  => $r->input('expires_at') ?: null,
            'uploaded_by' => Auth::id(),
        ]);

        if ($r->filled('tags')) {
            $ids = collect($r->input('tags', []))
                ->map(fn($t) => Tag::firstOrCreate(['name' => trim((string)$t)])->id)
                ->all();
            $doc->tags()->sync($ids);
        }

        // AUDIT: upload
        Audit::log($r, 'upload', [
            'employee_id' => $employeeId,
            'document_id' => $doc->id,
            'meta' => [
                'title' => $doc->title,
                'path'  => $doc->path,
                'hash'  => $doc->hash,
            ],
        ]);

        return response()->json($doc->load('tags'), 201);
    }

    /**
     * Documents of an employee (employees limited to their own).
     */
    public function byEmployee(Request $r, Employee $employee)
    {
        $this->ensureEmployeeOwns($r, $employee->id);

        $q = $employee->documents()->with('tags');

        if ($r->boolean('with_trashed')) {
            $q->withTrashed();
        }

        return $q->latest()->paginate(20);
    }


    /**
     * Search documents (admins/staff unrestricted; employees restricted to own).
     */
    public function search(Request $r)
    {
        $user = $r->user();

        $q = Document::with(['employee', 'tags']);

        // Restrict employees first
        if ($user?->role === 'employee') {
            $q->where('employee_id', (int)$user->employee_id);
        }

        // IMPORTANT: group OR conditions so they don't escape the employee restriction
        if ($r->filled('q')) {
            $term = '%' . $r->q . '%';
            $q->where(function ($w) use ($term) {
                $w->where('title', 'like', $term)
                    ->orWhereHas('employee', fn($x) => $x
                        ->where('last_name', 'like', $term)
                        ->orWhere('first_name', 'like', $term))
                    ->orWhereHas('tags', fn($x) => $x->where('name', 'like', $term));
            });
        }

        if ($r->filled('employee_id')) {
            if ($user?->role === 'employee' && (int)$user->employee_id !== (int)$r->employee_id) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
            $q->where('employee_id', (int)$r->employee_id);
        }

        return $q->latest()->paginate(20);
    }

    /**
     * Stream file inline (employees limited to their own).
     */
    public function view(Document $document, Request $r)
    {
        $user = $r->user();
        if ($user?->role === 'employee' && (int)$user->employee_id !== (int)$document->employee_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $fs = Storage::disk($this->disk);

        if (!$fs->exists($document->path)) {
            abort(404, 'File not found.');
        }

        // Friendly filename: "Last, First - Title.ext"
        $emp  = $document->employee()->first();
        $base = $emp ? ($emp->last_name . ', ' . $emp->first_name) : 'employee';
        $ext  = pathinfo($document->path, PATHINFO_EXTENSION);
        $name = trim($base . ' - ' . ($document->title ?: 'file')) . ($ext ? ".{$ext}" : '');

        // AUDIT: view
        Audit::log($r, 'view', [
            'employee_id' => $document->employee_id,
            'document_id' => $document->id,
            'meta' => [
                'title' => $document->title,
                'path'  => $document->path,
            ],
        ]);

        $mime = File::mimeType($fs->path($document->path)) ?? 'application/octet-stream';

        // Use the local filesystem path and Laravel's response()->file to stream inline
        return response()->file(
            $fs->path($document->path),
            [
                'Content-Type' => $mime,
                'Content-Disposition' => 'inline; filename="' . $name . '"; filename*=UTF-8\'\'' . rawurlencode($name),
            ]
        );
    }

    /**
     * Download file (employees limited to their own).
     */
    public function download(Document $document, Request $r)
    {
        $user = $r->user();
        if ($user?->role === 'employee' && (int)$user->employee_id !== (int)$document->employee_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $fs = Storage::disk($this->disk);

        if (!$fs->exists($document->path)) {
            abort(404, 'File not found.');
        }

        $emp  = $document->employee()->first();
        $base = $emp ? ($emp->last_name . ', ' . $emp->first_name) : 'employee';
        $ext  = pathinfo($document->path, PATHINFO_EXTENSION);
        $name = trim($base . ' - ' . ($document->title ?: 'file')) . ($ext ? ".{$ext}" : '');

        // AUDIT: download
        Audit::log($r, 'download', [
            'employee_id' => $document->employee_id,
            'document_id' => $document->id,
            'meta' => [
                'title' => $document->title,
                'path'  => $document->path,
            ],
        ]);

        // Avoid IDE warnings + works for local disk
        return response()->download(
            $fs->path($document->path),
            $name
        );
    }

    /**
     * Soft delete (employees limited to their own).
     */
    public function destroy(Request $r, Document $document)
    {
        // Optional: if you're using SoftDeletes, this is fine:
        // use Illuminate\Database\Eloquent\SoftDeletes; in Document model.

        // Employees may only delete their own documents
        $user = $r->user();
        if ($user?->role === 'employee' && (int)$user->employee_id !== (int)$document->employee_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // AUDIT: delete
        Audit::log($r, 'delete', [
            'employee_id' => $document->employee_id,
            'document_id' => $document->id,
            'meta' => [
                'title' => $document->title,
                'path'  => $document->path,
            ],
        ]);

        $document->delete();
        return response()->noContent();
    }

    /**
     * Restore soft-deleted document (admins/staff; employee only own).
     */
    public function restore(Request $r, Document $document)
    {
        // NOTE: route-model binding with soft deletes needs withTrashed in route binding
        // If this fails to find trashed docs, use restoreById instead (see below).

        $user = $r->user();
        if ($user?->role === 'employee' && (int)$user->employee_id !== (int)$document->employee_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (method_exists($document, 'trashed') && !$document->trashed()) {
            return response()->json(['message' => 'Document is not deleted.'], 422);
        }

        $document->restore();

        // AUDIT: restore
        Audit::log($r, 'restore', [
            'employee_id' => $document->employee_id,
            'document_id' => $document->id,
        ]);

        return response()->json($document->load('tags'));
    }

    /**
     * Alternative restore if you prefer ID-based lookup (works even if binding doesn't include trashed)
     */
    public function restoreById(Request $r, int $id)
    {
        $doc = Document::withTrashed()->findOrFail($id);

        $user = $r->user();
        if ($user?->role === 'employee' && (int)$user->employee_id !== (int)$doc->employee_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $doc->restore();

        Audit::log($r, 'restore', [
            'employee_id' => $doc->employee_id,
            'document_id' => $doc->id,
        ]);

        return response()->json($doc->load('tags'));
    }

    /**
     * Replace file content (employees limited to their own).
     */
    public function replaceFile(Request $r, Document $document)
    {
        $user = $r->user();
        $this->ensureEmployeeOwns($r, (int)$document->employee_id);

        if ($user?->role === 'employee' && (int)$user->employee_id !== (int)$document->employee_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $r->validate(['file' => 'required|file|max:30720']); // 30MB

        if (method_exists($document, 'trashed') && $document->trashed()) {
            return response()->json(['message' => 'Restore the document before replacing the file.'], 422);
        }

        $fs = Storage::disk($this->disk);

        $oldPath    = $document->path;
        $employeeId = (int)$document->employee_id;

        $newPath = $r->file('file')->store("documents/{$employeeId}", $this->disk);
        $hash    = hash_file('sha256', $r->file('file')->getRealPath());

        $document->update([
            'path' => $newPath,
            'hash' => $hash,
        ]);

        if ($oldPath && $oldPath !== $newPath && $fs->exists($oldPath)) {
            $fs->delete($oldPath);
        }

        // AUDIT: replace
        Audit::log($r, 'replace', [
            'employee_id' => $document->employee_id,
            'document_id' => $document->id,
            'meta' => [
                'old_path' => $oldPath,
                'new_path' => $newPath,
            ],
        ]);

        return response()->json($document->load('tags'));
    }
}
