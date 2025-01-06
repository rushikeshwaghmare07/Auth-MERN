import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config({
  path: "./.env",
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  secure: true,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export default transporter;
