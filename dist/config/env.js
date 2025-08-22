"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV = void 0;
// src/config/env.ts
require("dotenv/config");
function getEnv(name, fallback) {
    const value = process.env[name] ?? fallback;
    if (!value) {
        throw new Error(`Missing environment variable: ${name}`);
    }
    return value;
}
exports.ENV = {
    NODE_ENV: getEnv("NODE_ENV", "development"),
    PORT: parseInt(getEnv("PORT", "5000"), 10),
    // Frontend
    FRONTEND_URL: getEnv("FRONTEND_URL"),
    // Database
    DATABASE_URL: getEnv("DATABASE_URL"),
    // JWT
    ACCESS_SECRET: getEnv("JWT_ACCESS_SECRET"),
    REFRESH_SECRET: getEnv("JWT_REFRESH_SECRET"),
    RESET_SECRET: getEnv("JWT_RESET_SECRET"),
    ACCESS_EXPIRES: getEnv("JWT_ACCESS_EXPIRES", "15m"),
    REFRESH_EXPIRES: getEnv("JWT_REFRESH_EXPIRES", "7d"),
    // Mail
    SMTP_HOST: getEnv("SMTP_HOST"),
    SMTP_PORT: getEnv("SMTP_PORT"),
    SMTP_USER: getEnv("SMTP_USER"),
    SMTP_PASS: getEnv("SMTP_PASS"),
    SMTP_FROM: getEnv("SMTP_FROM"),
    // Cloudinary
    CLOUDINARY_CLOUD_NAME: getEnv("CLOUDINARY_CLOUD_NAME"),
    CLOUDINARY_API_KEY: getEnv("CLOUDINARY_API_KEY"),
    CLOUDINARY_API_SECRET: getEnv("CLOUDINARY_API_SECRET"),
};
//# sourceMappingURL=env.js.map