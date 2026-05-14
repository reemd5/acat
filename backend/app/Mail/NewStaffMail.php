<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewStaffMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $firstName;
    public string $lastName;
    public string $email;
    public string $password;

    public function __construct(string $firstName, string $lastName, string $email, string $password)
    {
        $this->firstName = $firstName;
        $this->lastName  = $lastName;
        $this->email     = $email;
        $this->password  = $password;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Account Credentials - Course Assessment System',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.new_staff',
        );
    }
}
