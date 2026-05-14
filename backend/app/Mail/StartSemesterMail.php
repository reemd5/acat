<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StartSemesterMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $firstName;
    public string $lastName;

    public function __construct(string $firstName, string $lastName)
    {
        $this->firstName = $firstName;
        $this->lastName  = $lastName;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Course Assessment – Welcome to the New Semester',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.start_semester',
        );
    }
}
