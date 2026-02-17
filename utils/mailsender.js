const nodemailer = require("nodemailer");
require("dotenv").config();
const mailsender = async (email, title, body, req, res) => {
    try{
            let transporter = nodemailer.createTransport({
                host:process.env.MAIL_HOST,
                auth:{
                    user: process.env.MAIL_USER,
                    pass: process.env.MAIL_PASS,
                }
            })


            let info = await transporter.sendMail({
                from: process.env.MAIL_USER,
                to:`${email}`,
                subject: `${title}`,
                html: `${body}`,
            })
            // console.log('hello',info);
            return { info };
    }
    catch(error) {
        res.status(500).json({
			success:false,
			message:"Internal Server Error" 
	})
        // console.log(error.message);
    }
}


module.exports = mailsender;