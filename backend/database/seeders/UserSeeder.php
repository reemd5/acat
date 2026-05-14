<?php

namespace Database\Seeders;

use App\Models\Campus;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'first_name' => 'ACAT',
                'last_name' => 'Developer',
                'email' => 'developer@acat.com',
                'password_hash' => Hash::make('developer@123')
            ],
        ];

        $admin_role = Role::where('role_name', 'admin')->first();

        foreach ($users as $userData) {

            // IMPORTANT: store the model
            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );

            // attach admin role
            $user->roles()->syncWithoutDetaching([$admin_role->id]);
        }

        // Get all campuses
        $campuses = Campus::all();

        // instructor role
        $instructor_role = Role::where('role_name', 'instructor')->first();

        foreach ($campuses as $campus) {

            User::factory(3)->create()->each(function ($user) use ($instructor_role, $campus) {

                // attach role
                $user->roles()->syncWithoutDetaching([$instructor_role->id]);

                // attach campus
                $campus->users()->syncWithoutDetaching([$user->id]);
            });
        }

        // coordinator role
        $coordinator_role = Role::where('role_name', 'coordinator')->first();

        foreach ($campuses as $campus) {

            User::factory(3)->create()->each(function ($user) use ($coordinator_role, $campus) {

                // attach role
                $user->roles()->syncWithoutDetaching([$coordinator_role->id]);

                // attach campus
                $campus->users()->syncWithoutDetaching([$user->id]);
            });
        }

    }
}