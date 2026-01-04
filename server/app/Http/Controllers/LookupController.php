<?php

namespace App\Http\Controllers;

use App\Models\{DocumentType, Tag};

class LookupController extends Controller
{
    public function documentTypes()
    {
        return DocumentType::orderBy('name')->get();
    }
    public function tags()
    {
        return Tag::orderBy('name')->get();
    }
}
