<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your Account Credentials</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .wrapper {
            max-width: 560px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .header {
            background-color: #1a3a5c;
            padding: 28px 32px;
            color: #ffffff;
        }
        .header h1 {
            margin: 0;
            font-size: 20px;
            font-weight: 600;
        }
        .body {
            padding: 28px 32px;
            color: #333333;
            font-size: 15px;
            line-height: 1.6;
        }
        .credentials-box {
            background-color: #f0f4f8;
            border-left: 4px solid #1a3a5c;
            border-radius: 4px;
            padding: 16px 20px;
            margin: 20px 0;
        }
        .credentials-box p {
            margin: 6px 0;
        }
        .credentials-box span {
            font-weight: 600;
            color: #1a3a5c;
        }
        .warning {
            background-color: #fff8e1;
            border: 1px solid #ffe082;
            border-radius: 4px;
            padding: 12px 16px;
            font-size: 13px;
            color: #7a5c00;
            margin-top: 20px;
        }
        .footer {
            padding: 16px 32px;
            background-color: #f4f4f4;
            font-size: 12px;
            color: #999999;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1>Course Assessment System</h1>
        </div>

        <div class="body">
            <p>Hello {{ $firstName }} {{ $lastName }},</p>

            <p>Your account has been created on the <strong>Course Assessment System</strong>. Use the credentials below to log in.</p>

            <div class="credentials-box">
                <p><span>Email:</span> {{ $email }}</p>
                <p><span>Password:</span> {{ $password }}</p>
            </div>

            <div class="warning">
                ⚠️ For your security, please change your password immediately after your first login via the <strong>Account</strong> page.
            </div>

            <p style="margin-top: 24px;">Regards,<br /><strong>Admin</strong></p>
        </div>

        <div class="footer">
            This is an automated message. Please do not reply.
        </div>
    </div>
</body>
</html>
