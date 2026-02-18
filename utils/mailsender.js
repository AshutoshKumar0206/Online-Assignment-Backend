const nodemailer = require("nodemailer");
require("dotenv").config();
const mailsender = async (email, title, body) => {
    try{
            let transporter = nodemailer.createTransport({
                host:process.env.MAIL_HOST,
                port: 587,
                auth:{
                    user: process.env.MAIL_USER,
                    pass: process.env.MAIL_PASS,
                },
                connectionTimeout: 10000,
            })


            let info = await transporter.sendMail({
                from: process.env.MAIL_USER,
                to:`${email}`,
                subject: `${title}`,
                html: `${body}`,
            })
            // console.log('hello',info);
            return info;
    }
    catch(error) {
       console.log(error);
       throw error;
        // console.log(error.message);
    }
}


module.exports = mailsender;
