import nodemailer from "nodemailer";
import {ENV} from "../config/env";

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
}

export const sendEmail = async ({ to, subject, text }: EmailOptions) => {
  try {
    const transporter = nodemailer.createTransport({
      host: ENV.SMTP_HOST,
      port: Number(ENV.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: ENV.SMTP_USER,
        pass: ENV.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Event Management" <${ENV.SMTP_USER}>`,
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error("Error sending email:", err);
    throw new Error("Email could not be sent");
  }
};
