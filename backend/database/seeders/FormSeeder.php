<?php

namespace Database\Seeders;

use App\Models\Form;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class FormSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $form = [
            "id" => 1,
            "form_name" => "Main Form",
            "description" => "Main Form"
        ];

        Form::updateOrCreate($form);
    }
}
