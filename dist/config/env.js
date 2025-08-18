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
    // Database
    DATABASE_URL: getEnv("DATABASE_URL"),
    // JWT
    ACCESS_SECRET: getEnv("JWT_ACCESS_SECRET"),
    REFRESH_SECRET: getEnv("JWT_REFRESH_SECRET"),
    ACCESS_EXPIRES: getEnv("JWT_ACCESS_EXPIRES", "15m"),
    REFRESH_EXPIRES: getEnv("JWT_REFRESH_EXPIRES", "7d"),
};
//# sourceMappingURL=env.js.map