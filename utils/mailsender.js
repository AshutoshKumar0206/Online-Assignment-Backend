const SibApiV3Sdk = require("sib-api-v3-sdk");

const sendMail = async (email, subject, htmlContent) => {
  try {
    const client = SibApiV3Sdk.ApiClient.instance;
    const apiKey = client.authentications["api-key"];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    console.log(apiKey.apiKey);

    const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

    const sender = {
      email: "submissionportalassignment@gmail.com", // must verify in Brevo
      name: "CollegeHub",
    };

    const receivers = [{ email }];

    const response = await tranEmailApi.sendTransacEmail({
      sender,
      to: receivers,
      subject: subject,
      htmlContent: htmlContent,
    });

    return response;
  } catch (error) {
    console.log("Brevo error:", error.response?.body || error.message);
    throw error;
  }
};

module.exports = sendMail;
