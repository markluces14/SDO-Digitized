<?php

namespace App\Http\Controllers;

use App\Models\{Document, Employee, Tag};
use Illuminate\Http\Request;
use App\Http\Requests\StoreDocumentRequest;
use Illuminate\Support\Facades\{Auth, Storage, File};
use App\Support\Audit;

class DocumentController extends Controller
{
    /**
     * Keep storage consistent everywhere (store/view/download/force delete)
     */
    private string $disk = 'local';

    private function ensureEmployeeOwns(Request $r, int $employeeId): void
    {
        $u = $r->user();
        if ($u && $u->role === 'employee') {
            abort_if((int) optional($u->employee)->id !== (int) $employeeId, 403);
        }
    }

    /**
     * Upload a document
     */
    public function store(StoreDocumentRequest $r)
    {
        $user = $r->user();
        $employeeId = (int) $r->input('employee_id');

        $this->ensureEmployeeOwns($r, $employeeId);

        if ($user?->role === 'employee' && (int) $user->employee_id !== $employeeId) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $file = $r->file('file');

        $path = $file->store("documents/{$employeeId}", $this->disk);
        $hash = hash_file('sha256', $file->getRealPath());

        $doc = Document::create([
            'employee_id' => $employeeId,
            'title'       => (string) $r->input('title'),
            'path'        => $path,
            'hash'        => $hash,
            'issued_at'   => $r->input('issued_at') ?: null,
            'expires_at'  => $r->input('expires_at') ?: null,
            'uploaded_by' => Auth::id(),
        ]);

        // tags[] from frontend becomes "tags" in Laravel
        $tags = $r->input('tags', []);
        if (!empty($tags)) {
            $ids = collect($tags)
                ->map(fn($t) => Tag::firstOrCreate(['name' => trim((string) $t)])->id)
                ->all();
            $doc->tags()->sync($ids);
        }

        // ✅ AUDIT (correct signature)
        Audit::log(
            $r,
            'upload',
            $doc->id,
            $employeeId,
            'Uploaded document: ' . $doc->title
        );

        return response()->json($doc->load('tags'), 201);
    }

    /**
     * Documents of an employee
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
     * Search documents
     */
    public function search(Request $r)
    {
        $user = $r->user();

        $q = Document::with(['employee', 'tags']);

        if ($user?->role === 'employee') {
            $q->where('employee_id', (int) $user->employee_id);
        }

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
            if ($user?->role === 'employee' && (int) $user->employee_id !== (int) $r->employee_id) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
            $q->where('employee_id', (int) $r->employee_id);
        }

        return $q->latest()->paginate(20);
    }

    /**
     * View (inline)
     */
    public function view(Document $document, Request $r)
    {
        $user = $r->user();
        if ($user?->role === 'employee' && (int) $user->employee_id !== (int) $document->employee_id) {
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

        // ✅ AUDIT (correct signature)
        Audit::log(
            $r,
            'view',
            $document->id,
            $document->employee_id,
            'Viewed document: ' . $document->title
        );

        $mime = File::mimeType($fs->path($document->path)) ?? 'application/octet-stream';

        return response()->file(
            $fs->path($document->path),
            [
                'Content-Type' => $mime,
                'Content-Disposition' => 'inline; filename="' . $name . '"; filename*=UTF-8\'\'' . rawurlencode($name),
            ]
        );
    }

    /**
     * Download
     */
    public function download(Document $document, Request $r)
    {
        $user = $r->user();
        if ($user?->role === 'employee' && (int) $user->employee_id !== (int) $document->employee_id) {
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

        // ✅ AUDIT (correct signature)
        Audit::log(
            $r,
            'download',
            $document->id,
            $document->employee_id,
            'Downloaded document: ' . $document->title
        );

        return response()->download($fs->path($document->path), $name);
    }

    /**
     * Soft delete
     */
    public function destroy(Request $r, Document $document)
    {
        $user = $r->user();
        if ($user?->role === 'employee' && (int) $user->employee_id !== (int) $document->employee_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // ✅ AUDIT (correct signature)
        Audit::log(
            $r,
            'delete',
            $document->id,
            $document->employee_id,
            'Soft-deleted document: ' . $document->title
        );

        $document->delete();
        return response()->noContent();
    }

    /**
     * Restore soft deleted
     */
    public function restore(Request $r, Document $document)
    {
        $user = $r->user();
        if ($user?->role === 'employee' && (int) $user->employee_id !== (int) $document->employee_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (method_exists($document, 'trashed') && !$document->trashed()) {
            return response()->json(['message' => 'Document is not deleted.'], 422);
        }

        $document->restore();

        Audit::log(
            $r,
            'restore',
            $document->id,
            $document->employee_id,
            'Restored document: ' . $document->title
        );

        return response()->json($document->load('tags'));
    }
    public function restoreById(Request $r, int $id)
    {
        $doc = Document::withTrashed()->findOrFail($id);

        $user = $r->user();
        if ($user?->role === 'employee' && (int) $user->employee_id !== (int) $doc->employee_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (method_exists($doc, 'trashed') && !$doc->trashed()) {
            return response()->json(['message' => 'Document is not deleted.'], 422);
        }

        $doc->restore();

        Audit::log(
            $r,
            'restore',
            $doc->id,
            $doc->employee_id,
            'Restored document: ' . $doc->title
        );

        return response()->json($doc->load('tags'));
    }


    /**
     * Replace file
     */
    public function replaceFile(Request $r, Document $document)
    {
        $user = $r->user();
        $this->ensureEmployeeOwns($r, (int) $document->employee_id);

        if ($user?->role === 'employee' && (int) $user->employee_id !== (int) $document->employee_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $r->validate(['file' => 'required|file|max:30720']); // 30MB

        if (method_exists($document, 'trashed') && $document->trashed()) {
            return response()->json(['message' => 'Restore the document before replacing the file.'], 422);
        }

        $fs = Storage::disk($this->disk);

        $oldPath    = $document->path;
        $employeeId = (int) $document->employee_id;

        $newPath = $r->file('file')->store("documents/{$employeeId}", $this->disk);
        $hash    = hash_file('sha256', $r->file('file')->getRealPath());

        $document->update([
            'path' => $newPath,
            'hash' => $hash,
        ]);

        if ($oldPath && $oldPath !== $newPath && $fs->exists($oldPath)) {
            $fs->delete($oldPath);
        }

        Audit::log(
            $r,
            'replace',
            $document->id,
            $document->employee_id,
            'Replaced file for: ' . $document->title
        );

        return response()->json($document->load('tags'));
    }

    /**
     * Permanent delete (Trash)
     */
    public function forceDestroy(Request $r, int $id)
    {
        $doc = Document::withTrashed()->findOrFail($id);

        $user = $r->user();
        if ($user?->role === 'employee') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $fs = Storage::disk($this->disk);

        // ✅ AUDIT before delete
        Audit::log(
            $r,
            'trash',
            $doc->id,
            $doc->employee_id,
            'Permanently deleted: ' . $doc->title
        );

        if (!empty($doc->path) && $fs->exists($doc->path)) {
            $fs->delete($doc->path);
        }

        $doc->forceDelete();

        return response()->json(['message' => 'Document permanently deleted.']);
    }
}
