<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class EmailController extends Controller
{
    public function send(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email',
                'subject' => 'required|string',
                'message' => 'required|string',
                'from_email' => 'required|email',
                'from_name' => 'required|string',
            ]);

            Mail::raw($request->message, function ($mail) use ($request) {
                $mail->to($request->email)
                     ->subject($request->subject)
                     ->replyTo($request->from_email, $request->from_name);
            });

            return response()->json([
                'message' => 'Email sent successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to send email',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
