<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Department;

class UserDepartmentSeeder extends Seeder
{
    public function run()
    {
        //get all users and departments
        $users = User::all();
        $departments = Department::all();

        //loop through each user and assign them randomly
        foreach($users as $user) {
            $randomDepartments = $departments->random(rand(1,$departments->count()))->pluck('id')->toArray();
            $user->departments()->sync($randomDepartments);
        }
  
    }
}
