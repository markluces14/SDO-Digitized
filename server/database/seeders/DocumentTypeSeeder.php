<?php

namespace Database\Seeders;

use App\Models\DocumentType;
use Illuminate\Database\Seeder;

class DocumentTypeSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $types = [
            ['code' => 'APPT',   'name' => 'Appointment (Form 33)'],
            ['code' => 'ASSUME', 'name' => 'Assumption to Duty'],
            ['code' => 'OATH',   'name' => 'Oath of Office'],
            ['code' => 'PDS',    'name' => 'Personal Data Sheet (CSC Form 212)'],
            ['code' => 'PDF',    'name' => 'Position Description Form'],
            ['code' => 'ELIG',   'name' => 'Eligibility/License'],          // <- no "?"
            ['code' => 'DESIG',  'name' => 'Designation Order'],
            ['code' => 'NSA',    'name' => 'Notice of Salary Adjustment'],
            ['code' => 'MED',    'name' => 'Medical Certificate'],          // <- no 365
            ['code' => 'NBI',    'name' => 'NBI Clearance'],                // <- no 365
            ['code' => 'DIP',    'name' => 'Diploma / TOR'],
            ['code' => 'MARR',   'name' => 'Marriage Contract'],
            ['code' => 'DISC',   'name' => 'Disciplinary Action'],
            ['code' => 'LEAVE',  'name' => 'Certificate of Leave Balances'],
            ['code' => 'CLEAR',  'name' => 'Clearance from Property & Money Accountabilities'],
            ['code' => 'COMMEND', 'name' => 'Commendations/Awards'],
            ['code' => 'COS',    'name' => 'Contract of Service'],
        ];

        // add timestamps consistently
        $types = array_map(fn($t) => $t + ['created_at' => $now, 'updated_at' => $now], $types);

        DocumentType::upsert($types, ['code'], ['name', 'updated_at']);
    }
}
