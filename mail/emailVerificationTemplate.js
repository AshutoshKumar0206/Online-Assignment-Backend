const otpTemplate = (otp) => {
    return `<!DOCTYPE html>
    <html>
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>OTP Verification</title>
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
                border: 1px solid #ccc;
                box-shadow: 0px 0px 8px rgba(0, 0, 0, 0.1);
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
                font-size: 24px;
                color: #0056b3;
                padding: 12px;
                border: 1px solid #0056b3;
                display: inline-block;
                margin-top: 10px;
            }
    
            .cta {
                display: inline-block;
                padding: 12px 25px;
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
            <div class="message">OTP Verification</div>
            <div class="body">
                <p>Dear User,</p>
                <p>Please use the following one-time password (OTP) to complete your verification process:</p>
                <div class="highlight">${otp}</div>
                <p>This OTP is valid for 5 minutes only.</p>
            </div>
            <div class="support">
                For any inquiries, please contact our support team at 
                <a href="mailto:support@collegehub.com">support@collegehub.com</a>.
            </div>
            <p class="footer">
                This is an automated message. If you did not request this OTP, please disregard this email.
            </p>
        </div>
    </body>
    
    </html>`;
};

module.exports = otpTemplate;
