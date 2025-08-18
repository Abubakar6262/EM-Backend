// src/config/env.ts
import "dotenv/config";
import { SignOptions } from "jsonwebtoken";

function getEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const ENV = {
  NODE_ENV: getEnv("NODE_ENV", "development"),
  PORT: parseInt(getEnv("PORT", "5000"), 10),

  // Database
  DATABASE_URL: getEnv("DATABASE_URL"),

  // JWT
  ACCESS_SECRET: getEnv("JWT_ACCESS_SECRET"),
  REFRESH_SECRET: getEnv("JWT_REFRESH_SECRET"),
  ACCESS_EXPIRES: getEnv(
    "JWT_ACCESS_EXPIRES",
    "15m"
  ) as SignOptions["expiresIn"],
  REFRESH_EXPIRES: getEnv(
    "JWT_REFRESH_EXPIRES",
    "7d"
  ) as SignOptions["expiresIn"],
};
