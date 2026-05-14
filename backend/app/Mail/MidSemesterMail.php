<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MidSemesterMail extends Mailable
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
            subject: 'Course Assessment – Mid-Semester Reminder',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.mid_semester',
        );
    }
}
