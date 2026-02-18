const nodemailer = require("nodemailer");
require("dotenv").config();

export const transporter = nodemailer.createTransport({
    host:process.env.MAIL_HOST,
    port: 587,
    auth:{
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
    connectionTimeout: 10000,
})
