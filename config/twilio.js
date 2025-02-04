const twilio = require("twilio")
require("dotenv").config

exports.twilio = () => {
try{
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = twilio(accountSid, authToken);
    const twilioNumber = process.env.CONTACT;

}catch(err){
    console.log(err);
}
}