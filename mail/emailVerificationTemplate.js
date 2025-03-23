const otpTemplate = (otp) => {
    return `<!DOCTYPE html>
    <html>
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>OTP Verification Email</title>
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
                border: 1px solid #ddd;
                box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
            }
    
            .logo {
                max-width: 150px;
                margin-bottom: 20px;
            }
    
            .message {
                font-size: 20px;
                font-weight: bold;
                color: #000000;
                margin-bottom: 20px;
            }
    
            .body {
                font-size: 16px;
                color: #333333;
                margin-bottom: 20px;
            }
    
            .highlight {
                font-weight: bold;
                font-size: 22px;
                color: #FFD60A;
                display: inline-block;
                padding: 10px;
                border: 1px dashed #FFD60A;
                margin-top: 10px;
            }
    
            .cta {
                display: inline-block;
                padding: 12px 25px;
                background-color: #FFD60A;
                color: #000000;
                text-decoration: none;
                border-radius: 5px;
                font-size: 16px;
                font-weight: bold;
                margin-top: 20px;
            }
    
            .support {
                font-size: 14px;
                color: #666666;
                margin-top: 20px;
            }
    
            .footer {
                font-size: 12px;
                color: #888888;
                margin-top: 20px;
                text-align: center;
            }

        </style>
    </head>
    
    <body>
        <div class="container">
            <div class="message">OTP Verification Email</div>
            <div class="body">
                <p>Hi There,</p>
                <p>Your verification code is:</p>
                <div class="highlight">${otp}</div>
                <p>This code is valid for the next <strong>5 minutes</strong>.</p>
            </div>
            <div class="support">
                If you have any issues, reach out to us at 
                <a href="mailto:support@collegehub.com">support@collegehub.com</a>. We are here to help!
            </div>
            <p class="footer">
                This is an automated email. If you didn’t request this OTP, please ignore this message.<br>
            </p>
        </div>
    </body>
    
    </html>`;
};

module.exports = otpTemplate;
