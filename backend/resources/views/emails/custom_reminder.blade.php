<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Action Required – Course Assessment</title>
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
            <p>Dear {{ $firstName }} {{ $lastName }},</p>

            <p>This is a reminder that you have outstanding course assessment assignments that require your attention.</p>

            <p>Please log in to the Course Assessment System and ensure all required data for your assigned course offerings is entered accurately and on time.</p>

            <p>Timely submission is important for the proper evaluation of course outcomes. If you have already completed your submissions, please disregard this message.</p>

            <p style="margin-top: 24px;">
                Best regards,<br />
                <strong>Course Assessment System</strong>
            </p>
        </div>

        <div class="footer">
            This is an automated message. Please do not reply.
        </div>
    </div>
</body>
</html>
