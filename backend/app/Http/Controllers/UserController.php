<?php

namespace App\Http\Controllers;

use App\Mail\NewStaffMail;
use App\Models\Campus;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class UserController extends Controller
{public function index()
{
    try {
        $queryParams = request()->query();

        $users = User::query()->with(['roles', 'campuses', 'departments']);

        if (isset($queryParams['role'])) {
            
            if ($queryParams['role'] == 'instructor') {
                $users->whereHas('roles', function ($q) {
                    $q->where('role_id', 3);
                });
            } 
            
            else if ($queryParams['role'] == 'admin') {
                $users->whereHas('roles', function ($q) {
                    $q->where('role_id', 2);
                });
            }
            
            else if ($queryParams['role'] == 'coordinator') {
                $users->whereHas('roles', function ($q) {
                    $q->where('role_id', 4);
                });
            }
            
        }

        return response()->json($users->get());

    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Failed to retrieve users',
            'message' => $e->getMessage()
        ], 500);
    }
}

    // public function store(Request $request)
    // {
    //     $user = User::create([
    //         'first_name' => $request->first_name,
    //         'last_name' => $request->last_name,
    //         'email' => $request->email,
    //         'password' => bcrypt($request->password),
    //         'role' => json_encode($request->role),
    //         'campus' => json_encode($request->campus),
    //         'department' => $request->department,
    //     ]);

    //     return response()->json($user, 201);
    // }

    public function store(Request $request)
    {
        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password_hash' => bcrypt($request->password ?? 'acat@lau26'),
        ]);

        // roles
        if ($request->role) {
            $roleIds = Role::whereIn('role_name', $request->role)->pluck('id');
            $user->roles()->sync($roleIds);
        }

        // campuses
        if ($request->campus) {
            $campusIds = Campus::whereIn('campus_name', $request->campus)->pluck('id');
            $user->campuses()->sync($campusIds);
        }

        // departments
        if ($request->department) {
            $departmentIds = \App\Models\Department::where('department_name', $request->department)->pluck('id');
            $user->departments()->sync($departmentIds);
        }

        $plainPassword = $request->password ?? 'acat@lau26';

        
        Mail::to($user->email)->send(
            new NewStaffMail($user->first_name, $user->last_name, $user->email, $plainPassword)
        );
        

        return response()->json($user->load(['roles', 'campuses', 'departments']), 201);
    }

    public function show($id)
    {
        return User::findOrFail($id);
    }

    // public function update(Request $request, $id)
    // {
    //     $user = User::findOrFail($id);

    //     $user->update($request->all());

    //     return response()->json($user);
    // }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $user->update([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
        ]);

        if ($request->filled('password')) {
            $user->update([
                'password_hash' => bcrypt($request->password)
            ]);
        }

        if ($request->role) {
            $roleIds = \App\Models\Role::whereIn('role_name', $request->role)->pluck('id');
            $user->roles()->sync($roleIds);
        }

        if ($request->campus) {
            $campusIds = \App\Models\Campus::whereIn('campus_name', $request->campus)->pluck('id');
            $user->campuses()->sync($campusIds);
        }

        if ($request->has('department')) {
            $departmentIds = $request->department
                ? \App\Models\Department::where('department_name', $request->department)->pluck('id')
                : [];

            $user->departments()->sync($departmentIds);
        }

        return response()->json(
            $user->load(['roles', 'campuses', 'departments'])
        );
    }

    public function updatePassword(Request $request, $id)
    {
        $request->validate([
            'password' => 'required|string|min:1',
        ]);

        $user = User::findOrFail($id);
        $user->update(['password_hash' => bcrypt($request->password)]);

        return response()->json(['message' => 'Password updated successfully.']);
    }

    public function destroy($id)
    {
        User::destroy($id);
        return response()->json(['message' => 'Deleted']);
    }
}
