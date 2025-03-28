const otpTemplate = (otp) => {
    return `<!DOCTYPE html>
    <html>
    
    <head>
        <meta charset="UTF-8">
        <title>Reset Password OTP</title>
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
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 20px;
            }
    
            .body {
                font-size: 16px;
                margin-bottom: 20px;
            }
    
            .cta {
                display: inline-block;
                padding: 10px 20px;
                background-color: #0056b3;
                color: #ffffff;
                text-decoration: none;
                border-radius: 5px;
                font-size: 16px;
                font-weight: bold;
                margin-top: 20px;
            }
    
            .support {
                font-size: 14px;
                color: #999999;
                margin-top: 20px;
            }
    
            .highlight {
                font-weight: bold;
            }
        </style>
    
    </head>
    
    <body>
        <div class="container">
            <div class="message">Reset Password Verification</div>
            <div class="body">
                <p>Dear User,</p>
                <p>Please use the following one-time password (OTP) to complete your password reset process:</p>
                <h2 class="highlight">${otp}</h2>
                <p>This code is valid for 5 minutes.</p>
            </div>
            <div class="support">
                If you require further assistance, please contact our support team at <a href="mailto:btech10160.22@bitmesra.ac.in">btech10160.22@bitmesra.ac.in</a>.
            </div>
            <p style="color:gray; font-size:12px;">
                This is an automated email. If you did not request this OTP, please disregard this message.
            </p>
        </div>
    </body>
    
    </html>`;
};
module.exports = otpTemplate;