const mongoose = require("mongoose");
const mailSender = require("../utils/mailsender");
const emailTemplate = require("../mail/emailVerificationTemplate")

const OTPSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
	},
	// count: {
    //     type: Number,
	// },
	otp: {
		type: String,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
		expires: 60 * 5, // The document will be automatically deleted after 5 minutes of its creation time
	},
});

// Define a function to send emails
async function sendVerificationEmail(email, otp) {

	// Send the email
	try {
		const mailResponse = await mailSender(
			email,
			"Verification Email",
			emailTemplate(otp)
		);
		// console.log("Email sent successfully: ", mailResponse);
	} catch (error) {
		// console.log("Error occurred while sending email: ", error);
		throw error;
	}
}
OTPSchema.add({
	emailSent: { type: Boolean, default: false },
})
// Define a post-save hook to send email after the document has been saved
OTPSchema.post("save", async function (next) {
	// console.log("New document saved to database");

	// Only send an email when a new document is created
	if (this.isNew && !this.emailSent) {
		await sendVerificationEmail(this.email, this.otp);
		this.emailSent = true;
		await this.save();
	}
});

const OTP = mongoose.model("OTP", OTPSchema);

module.exports = OTP;