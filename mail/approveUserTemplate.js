const approvedUserTemplate = (firstName, lastName, role) => {
    return `<!DOCTYPE html>
    <html>
    
    <head>
        <meta charset="UTF-8">
        <title>Account Approval Notification</title>
        <style>
            body {
                background-color: #ffffff;
                font-family: Arial, sans-serif;
                font-size: 16px;
                line-height: 1.4;
                color: #333333;
                margin: 0;
                padding: 0;
            }
    
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                text-align: center;
            }
    
            .logo {
                max-width: 200px;
                margin-bottom: 20px;
            }
    
            .message {
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 20px;
            }
    
            .body {
                font-size: 16px;
                margin-bottom: 20px;
                text-align: left;
            }
    
            .signature {
                font-size: 16px;
                margin-top: 30px;
            }
    
            .support {
                font-size: 14px;
                color: #777777;
                margin-top: 20px;
            }
    
            .highlight {
                font-weight: bold;
            }
        </style>
    
    </head>
    
    <body>
        <div class="container">
            <div class="message">Account Approval Notification</div>
            <div class="body">
                <p>Dear ${firstName} ${lastName},</p>
                <p>We are pleased to inform you that your account for CollegeHub has been reviewed and approved. Your registered role is:</p>
                <h2 class="highlight">${role}</h2>
                <p>Please use your credentials to access the platform. Should you have any questions, feel free to contact our support team.</p>
            </div>
            <div class="signature">
                <p>Sincerely,</p>
                <p>The CollegeHub Team</p>
            </div>
            <div class="support">
                <p>If you require further assistance, please contact us at <a href="mailto:btech10160.22@bitmesra.ac.in">btech10160.22@bitmesra.ac.in</a>.</p>
            </div>
            <p style="color:gray; font-size:12px;">
                This is an automated notification. Please do not reply to this email.
            </p>
        </div>
    </body>
    
    </html>`;
};
module.exports = approvedUserTemplate;