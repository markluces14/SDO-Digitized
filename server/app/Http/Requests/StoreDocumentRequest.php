<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDocumentRequest extends FormRequest
{
    public function rules()
    {
        return [
            'employee_id' => ['required', 'exists:employees,id'],
            'title'       => ['required', 'string', 'max:255'],
            'issued_at'   => ['nullable', 'date'],
            'expires_at'  => ['nullable', 'date'],
            'file'        => ['required', 'file', 'max:20480'], // 20MB
            'tags'        => ['array'],
            'tags.*'      => ['string', 'max:50'],
        ];
    }
}
