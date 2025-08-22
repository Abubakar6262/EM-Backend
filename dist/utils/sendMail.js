"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
const sendEmail = async ({ to, subject, text }) => {
    try {
        const transporter = nodemailer_1.default.createTransport({
            host: env_1.ENV.SMTP_HOST,
            port: Number(env_1.ENV.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: env_1.ENV.SMTP_USER,
                pass: env_1.ENV.SMTP_PASS,
            },
        });
        await transporter.sendMail({
            from: `"Event Management" <${env_1.ENV.SMTP_USER}>`,
            to,
            subject,
            text,
        });
    }
    catch (err) {
        console.error("Error sending email:", err);
        throw new Error("Email could not be sent");
    }
};
exports.sendEmail = sendEmail;
//# sourceMappingURL=sendMail.js.map