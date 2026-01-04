<?php

namespace App\Http\Controllers;

use App\Models\{Document, Employee, Tag};
use Illuminate\Http\Request;
use App\Http\Requests\StoreDocumentRequest;
use Illuminate\Support\Facades\{Auth, Storage, File};

class DocumentController extends Controller
{
    private function ensureEmployeeOwns(Request $r, int $employeeId): void
    {
        $u = $r->user();
        if ($u->role === 'employee') {
            abort_if(optional($u->employee)->id !== $employeeId, 403);
        }
    }
    public function store(StoreDocumentRequest $r)
    {
        $user = $r->user();
        $employeeId = (int) $r->input('employee_id');
        $this->ensureEmployeeOwns($r, $employeeId);

        if ($user?->role === 'employee' && (int)$user->employee_id !== $employeeId) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $file = $r->file('file');
        $path = $file->store("documents/{$employeeId}");
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

        if ($r->filled('tags')) {
            $ids = collect($r->input('tags', []))
                ->map(fn($t) => Tag::firstOrCreate(['name' => trim($t)])->id)
                ->all();
            $doc->tags()->sync($ids);
        }

        return response()->json($doc->load('tags'), 201);
    }

    /**
     * Documents of an employee (employees limited to their own).
     */
    public function byEmployee(Request $r, Employee $employee)
    {
        $this->ensureEmployeeOwns($r, $employee->id);

        return $employee->documents()
            ->withTrashed()
            ->with('tags')
            ->latest()
            ->paginate(20);
    }

    /**
     * Search documents (admins/staff unrestricted; employees restricted to own).
     */
    public function search(Request $r)
    {
        $user = $r->user();

        $q = Document::with(['employee', 'tags']);

        if ($user?->role === 'employee') {
            $q->where('employee_id', (int)$user->employee_id);
        }

        if ($r->filled('q')) {
            $term = '%' . $r->q . '%';
            $q->where('title', 'like', $term)
                ->orWhereHas('employee', fn($x) => $x
                    ->where('last_name',  'like', $term)
                    ->orWhere('first_name', 'like', $term))
                ->orWhereHas('tags', fn($x) => $x->where('name', 'like', $term));
        }

        if ($r->filled('employee_id')) {
            if ($user?->role === 'employee' && (int)$user->employee_id !== (int)$r->employee_id) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
            $q->where('employee_id', $r->employee_id);
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

        $disk = 'local';
        $fs   = Storage::disk($disk);

        if (!$fs->exists($document->path)) {
            abort(404, 'File not found.');
        }

        // Friendly filename: "Last, First - Title.ext"
        $emp  = $document->employee()->first();
        $base = $emp ? ($emp->last_name . ', ' . $emp->first_name) : 'employee';
        $ext  = pathinfo($document->path, PATHINFO_EXTENSION);
        $name = trim($base . ' - ' . ($document->title ?: 'file')) . ($ext ? ".{$ext}" : '');

        // Let Storage stream it; add a sane content-type if you want
        $mime = File::mimeType($fs->path($document->path)) ?? 'application/octet-stream';
        return Storage::response($document->path, $name, [
            'Content-Type' => $mime,
            // Stream inline
            'Content-Disposition' => 'inline; filename="' . $name . '"; filename*=UTF-8\'\'' . rawurlencode($name),
        ]);
    }

    public function download(Document $document)
    {
        $disk = 'local';
        $fs   = Storage::disk($disk);

        if (!$fs->exists($document->path)) {
            abort(404, 'File not found.');
        }

        $emp  = $document->employee()->first();
        $base = $emp ? ($emp->last_name . ', ' . $emp->first_name) : 'employee';
        $ext  = pathinfo($document->path, PATHINFO_EXTENSION);
        $name = trim($base . ' - ' . ($document->title ?: 'file')) . ($ext ? ".{$ext}" : '');

        // Force download with a proper filename (also provides the Content-Disposition header)
        return Storage::download($document->path, $name);
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
        if ($user && $user->role === 'employee') {
            if ((int)$user->employee_id !== (int)$document->employee_id) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $document->delete();
        return response()->noContent(); // 204
    }
    /**
     * Restore soft-deleted document (admins/staff; employee only own).
     */
    public function restore($id, Request $r)
    {
        $doc  = Document::withTrashed()->findOrFail($id);
        $user = $r->user();

        if ($user?->role === 'employee' && (int)$user->employee_id !== (int)$doc->employee_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $doc->restore();
        return response()->json($doc->load('tags'));
    }

    /**
     * Replace file content (employees limited to their own).
     */
    public function replaceFile(Request $r, Document $document)
    {
        $user = $r->user();
        $this->ensureEmployeeOwns($r, $document->employee_id);
        if ($user?->role === 'employee' && (int)$user->employee_id !== (int)$document->employee_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $r->validate(['file' => 'required|file|max:30720']); // 30MB

        if (method_exists($document, 'trashed') && $document->trashed()) {
            return response()->json(['message' => 'Restore the document before replacing the file.'], 422);
        }

        $disk = 'local';
        $fs   = Storage::disk($disk);

        $oldPath    = $document->path;
        $employeeId = $document->employee_id;

        $newPath = $r->file('file')->store("documents/{$employeeId}", $disk);
        $hash    = hash_file('sha256', $r->file('file')->getRealPath());

        $document->update([
            'path' => $newPath,
            'hash' => $hash,
        ]);

        if ($oldPath && $oldPath !== $newPath && $fs->exists($oldPath)) {
            $fs->delete($oldPath);
        }

        return $document->load('tags');
    }
}
