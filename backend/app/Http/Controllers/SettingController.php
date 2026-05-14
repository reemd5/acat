<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        try {
            $setting = Setting::latest('id')->first();
             if (!$setting) {
                return response()->json(null);
            }

            $setting->year_number = (int) $setting?->current_year_number ?? 0;
            
           
            
            return response()->json($setting);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error retrieving settings.', 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'academic_year' => 'required|string',
            'current_semester' => 'required|string',
            'semester_start_date' => 'required|date',
            'semester_end_date' => 'required|date|after:semester_start_date',
            'year_number' => 'required|integer',
        ]);

        $validated['current_year_number'] = (int) $validated['year_number'];
        unset($validated['year_number']);

        $setting = Setting::create($validated);
        $setting->year_number = $setting->current_year_number;
        return response()->json($setting, 201);
    }

    public function show(Setting $setting)
    {
        return response()->json(['message' => 'Implement settings retrieval here.', 'data' => $setting]);
    }

    public function update(Request $request, Setting $setting)
    {
        $validated = $request->validate([
            'academic_year' => 'required|string',
            'current_semester' => 'required|string',
            'semester_start_date' => 'required|date',
            'semester_end_date' => 'required|date|after:semester_start_date',
            'year_number' => 'required|integer',
        ]);

        $validated['current_year_number'] = (int) $validated['year_number'];
        unset($validated['year_number']);

        $setting->update($validated);
        $setting->year_number = $setting->current_year_number;
        return response()->json($setting, 200);
    }

    public function destroy(Setting $setting)
    {
        return response()->json(['message' => 'Implement settings deletion here.', 'data' => $setting]);
    }
}
