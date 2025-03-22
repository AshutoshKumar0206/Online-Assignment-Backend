const approvedUserTemplate = (firstName, lastName, role) => {
	return `<!DOCTYPE html>
	<html>
	
	<head>
		<meta charset="UTF-8">
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
			<div class="message">User Approval Mail</div>
			<div class="body">
				<p>Dear ${firstName + " " + lastName},</p>
				<p>Thank you for registering with CollegeHub. You have been approved as:</p>
				<h2 class="highlight">${role}</h2>
				<p>by Admin</p>
			</div>
			<div class="support">If you have any questions or need assistance, please reach out to us at <a
					href="mailto:btech10160.22@bitmesra.ac.in">btech10160.22@bitmesra.ac.in</a>. We are here to help!
			</div>
			<p style="color:gray; font-size:12px;">
                This is an automated email. If you didn't request this OTP, ignore this message.
            </p>
		</div>
	</body>
	
	</html>`;
};
module.exports = approvedUserTemplate;