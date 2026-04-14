<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    /**
     * List employees (admins/staff only).
     */
    public function index(Request $r)
    {
        $user = $r->user();

        if ($user->role === 'employee') {
            $emp = optional($user->employee);
            abort_if(!$emp, 403, 'No employee profile.');
            return Employee::where('id', $emp->id)->paginate(1);
        }

        $q = Employee::query();

        if ($r->filled('q')) {
            $term = trim($r->q);
            $like = '%' . $term . '%';
            $q->where(function ($x) use ($like) {
                $x->where('employee_no', 'like', $like)
                    ->orWhere('first_name', 'like', $like)
                    ->orWhere('last_name', 'like', $like)
                    ->orWhereRaw("CONCAT(first_name,' ',last_name) like ?", [$like])
                    ->orWhereRaw("CONCAT(last_name, ', ', first_name) like ?", [$like])
                    ->orWhere('position', 'like', $like)
                    ->orWhere('department', 'like', $like);
            });
        }

        $perPage = (int) $r->get('per_page', 20);

        return $q
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate($perPage);
    }

    /**
     * Create new employee (admins/staff only).
     */
    public function store(Request $r)
    {
        $user = $r->user();
        if ($user?->role === 'employee') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $r->validate(
            [
                'employee_no'    => ['required', 'string', 'max:100'],
                'email'          => [
                    'required',
                    'email',
                    'max:255',
                    'unique:employees,email',
                    'unique:users,email',
                ],
                'first_name'     => ['required', 'string', 'max:100', 'regex:/^[\p{L}\s-]+$/u'],
                'middle_name'    => ['nullable', 'string', 'max:100', 'regex:/^[\p{L}\s-]+$/u'],
                'last_name'      => ['required', 'string', 'max:100', 'regex:/^[\p{L}\s-]+$/u'],
                'place_of_birth' => ['required', 'string', 'max:255'],
                'birthdate'      => ['required', 'date'],
                'gender'         => ['required', 'in:Male,Female'],
                'position'       => ['required', 'string', 'max:100'],
                'department'     => ['required', 'string', 'max:255'],
                'date_hired'     => ['required', 'date'],
            ],
            [
                'email.unique'       => 'This email is already being used.',
                'first_name.regex'   => 'First name may contain letters only (including ñ), spaces, and hyphen.',
                'middle_name.regex'  => 'Middle name may contain letters only (including ñ), spaces, and hyphen.',
                'last_name.regex'    => 'Last name may contain letters only (including ñ), spaces, and hyphen.',
            ]
        );

        foreach (['first_name', 'middle_name', 'last_name'] as $k) {
            if (isset($data[$k])) {
                $data[$k] = preg_replace('/\s+/u', ' ', trim($data[$k]));
            }
        }

        $emp = DB::transaction(function () use ($data) {
            $emp = Employee::create($data);

            $rawPass = Str::random(8);

            $newUser = User::create([
                'name'                 => trim(($data['first_name'] ?? '') . ' ' . ($data['last_name'] ?? '')),
                'email'                => $data['email'],
                'password'             => Hash::make($rawPass),
                'role'                 => 'employee',
                'employee_id'          => $emp->id,
                'is_active'            => true,
                'must_change_password' => true,
            ]);

            Mail::to($newUser->email)->send(
                new \App\Mail\EmployeeAccountCreatedMail(
                    name: $newUser->name,
                    email: $newUser->email,
                    password: $rawPass
                )
            );

            return $emp;
        });

        return response()->json($emp, 201);
    }

    /**
     * Update an employee.
     */
    public function update(Request $r, Employee $employee)
    {
        $user = $r->user();
        if ($user?->role === 'employee' && (int) $user->employee_id !== (int) $employee->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $linkedUser = User::where('employee_id', $employee->id)->first();

        $data = $r->validate(
            [
                'employee_no'    => ['sometimes', 'string', 'max:100'],
                'email'          => [
                    'sometimes',
                    'email',
                    'max:255',
                    Rule::unique('employees', 'email')->ignore($employee->id),
                    Rule::unique('users', 'email')->ignore($linkedUser?->id),
                ],
                'first_name'     => ['sometimes', 'string', 'max:100', 'regex:/^[\p{L}\s-]+$/u'],
                'middle_name'    => ['nullable', 'string', 'max:100', 'regex:/^[\p{L}\s-]+$/u'],
                'last_name'      => ['sometimes', 'string', 'max:100', 'regex:/^[\p{L}\s-]+$/u'],
                'place_of_birth' => ['sometimes', 'string', 'max:255'],
                'birthdate'      => ['sometimes', 'date'],
                'gender'         => ['sometimes', 'in:Male,Female'],
                'position'       => ['sometimes', 'string', 'max:100'],
                'department'     => ['sometimes', 'string', 'max:255'],
                'date_hired'     => ['sometimes', 'date'],
            ],
            [
                'email.unique'       => 'This email is already being used.',
                'first_name.regex'   => 'First name may contain letters only (including ñ), spaces, and hyphen.',
                'middle_name.regex'  => 'Middle name may contain letters only (including ñ), spaces, and hyphen.',
                'last_name.regex'    => 'Last name may contain letters only (including ñ), spaces, and hyphen.',
            ]
        );

        foreach (['first_name', 'middle_name', 'last_name'] as $k) {
            if (isset($data[$k])) {
                $data[$k] = preg_replace('/\s+/u', ' ', trim($data[$k]));
            }
        }

        $employee->update($data);

        if (isset($data['email']) && $linkedUser) {
            $linkedUser->update(['email' => $data['email']]);
        }

        return response()->json($employee->fresh());
    }

    /**
     * Show one employee (employees can only see their own).
     */
    public function show(Request $r, Employee $employee)
    {
        $user = $r->user();
        if ($user->role === 'employee') {
            abort_if(optional($user->employee)->id !== $employee->id, 403);
        }

        return response()->json([
            'id'             => $employee->id,
            'employee_no'    => $employee->employee_no,
            'email'          => $employee->email,
            'first_name'     => $employee->first_name,
            'middle_name'    => $employee->middle_name,
            'last_name'      => $employee->last_name,
            'place_of_birth' => $employee->place_of_birth,
            'birthdate'      => optional($employee->birthdate)->toDateString(),
            'gender'         => $employee->gender,
            'position'       => $employee->position,
            'department'     => $employee->department,
            'date_hired'     => optional($employee->date_hired)->toDateString(),
            'full_name'      => trim(sprintf(
                '%s, %s%s',
                (string) $employee->last_name,
                (string) $employee->first_name,
                $employee->middle_name ? ' ' . $employee->middle_name : ''
            )),
        ]);
    }
}
