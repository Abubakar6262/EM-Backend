"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyReset = exports.forgotPassword = exports.logout = exports.refreshToken = exports.login = exports.signup = void 0;
const prisma_1 = require("../services/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const jwt_1 = require("../utils/jwt");
const auth_schema_1 = require("../validators/auth.schema");
const sendMail_1 = require("../utils/sendMail");
const env_1 = require("../config/env");
const catchAsync_1 = __importDefault(require("../middlewares/catchAsync"));
// import { string } from "zod";
exports.signup = (0, catchAsync_1.default)(async (req, res) => {
    // Validate input using Zod
    const parsed = auth_schema_1.signupSchema.parse(req.body);
    const { email, password, fullName } = parsed;
    if (!email || !password || !fullName) {
        throw new ErrorHandler_1.default("Email, password, and full name are required", 400);
    }
    // Check if user already exists
    const exists = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (exists) {
        throw new ErrorHandler_1.default("Email already in use", 400);
    }
    // Hash password
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    // Create user
    await prisma_1.prisma.user.create({
        data: { email, passwordHash, fullName },
    });
    // For now, return simple success (login separately)
    // Or you could issue tokens directly here if you want auto-login after signup
    res.status(201).json({
        success: true,
        message: "Account created. Please log in.",
    });
});
exports.login = (0, catchAsync_1.default)(async (req, res) => {
    // Validate request body with Zod
    const parsed = auth_schema_1.loginSchema.parse(req.body);
    const { email, password } = parsed;
    if (!email || !password) {
        throw new ErrorHandler_1.default("Email and password are required", 400);
    }
    // Find user
    const user = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
        throw new ErrorHandler_1.default("Invalid credentials", 401);
    }
    // Verify password
    const ok = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!ok) {
        throw new ErrorHandler_1.default("Invalid credentials", 401);
    }
    // Issue tokens
    const { accessToken, refreshToken, refreshExp } = await (0, jwt_1.issueTokens)(user.id);
    await prisma_1.prisma.refreshToken.create({
        data: { userId: user.id, token: refreshToken, expiresAt: refreshExp },
    });
    // Set cookies + send response
    res
        .cookie("accessToken", accessToken, {
        httpOnly: true, // prevents JS access (XSS protection)
        secure: true, // HTTPS only
        sameSite: "strict", // CSRF protection
        maxAge: 15 * 60 * 1000, // 15 minutes
    })
        .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })
        .json({
        success: true,
        user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
        },
    });
});
exports.refreshToken = (0, catchAsync_1.default)(async (req, res) => {
    const oldRefreshToken = req.cookies.refreshToken;
    if (!oldRefreshToken) {
        throw new ErrorHandler_1.default("No refresh token provided", 401);
    }
    // Verify refresh token signature & expiry
    const payload = (0, jwt_1.verifyRefresh)(oldRefreshToken);
    // Check token exists in DB and is not revoked
    const stored = await prisma_1.prisma.refreshToken.findUnique({
        where: { token: oldRefreshToken },
    });
    if (!stored || stored.revokedAt !== null) {
        throw new ErrorHandler_1.default("Refresh token invalid", 401);
    }
    // Revoke old refresh token
    await prisma_1.prisma.refreshToken.update({
        where: { token: oldRefreshToken },
        data: { revokedAt: new Date() },
    });
    // Issue new tokens
    const { accessToken, refreshToken: newRefresh, refreshExp, } = await (0, jwt_1.issueTokens)(payload.sub);
    await prisma_1.prisma.refreshToken.create({
        data: {
            userId: payload.sub,
            token: newRefresh,
            expiresAt: refreshExp,
        },
    });
    // Set new cookies
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 1000 * 60 * 5, // 5m
    });
    res.cookie("refreshToken", newRefresh, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7d
    });
    res.json({
        success: true,
        message: "Token refreshed",
    });
});
exports.logout = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user; // from authMiddleware isAuthenticated
    if (!userId) {
        throw new ErrorHandler_1.default("Unauthorized", 401);
    }
    // Revoke all active refresh tokens for this user
    await prisma_1.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
    });
    // Clear cookies
    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
    });
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
    });
    res.json({
        success: true,
        message: "Logged out successfully",
    });
});
exports.forgotPassword = (0, catchAsync_1.default)(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new ErrorHandler_1.default("Email is required", 400);
    }
    // Find the user
    const user = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new ErrorHandler_1.default("User not found", 404);
    }
    // Generate a secure random token
    const token = (0, jwt_1.issueResetToken)(user.id);
    // Set expiry time: 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    // Store token (consider hashing if sensitive)
    await prisma_1.prisma.otpCode.create({
        data: {
            userId: user.id,
            code: token,
            expiresAt,
        },
    });
    // Create reset link
    const resetLink = `${env_1.ENV.FRONTEND_URL}/reset-password?token=${token}`;
    // Send email with the link
    await (0, sendMail_1.sendEmail)({
        to: user.email,
        subject: "Password Reset Link",
        text: `You requested a password reset. Click the link below to reset your password. The link expires in 10 minutes:\n\n${resetLink}`,
    });
    res.status(200).json({
        success: true,
        message: "Password reset link sent to your email.",
    });
});
exports.verifyReset = (0, catchAsync_1.default)(async (req, res) => {
    const { token } = req.query;
    const parsed = auth_schema_1.updatePasswordSchema.parse(req.body);
    const { newPassword } = parsed;
    const password = newPassword;
    // Validate token
    if (!token || typeof token !== "string") {
        throw new ErrorHandler_1.default("Reset token is required", 400);
    }
    // Validate password
    if (!password || password.length < 6) {
        throw new ErrorHandler_1.default("Password must be at least 6 characters", 400);
    }
    // Verify token signature (JWT)
    let payload;
    try {
        payload = (0, jwt_1.verifyResetToken)(token);
    }
    catch (err) {
        console.log("JWT verification error:", err);
        throw new ErrorHandler_1.default("Invalid or expired token", 400);
    }
    // Find token in database and check expiry
    const otpRecord = await prisma_1.prisma.otpCode.findFirst({
        where: {
            userId: payload.sub,
            code: token,
            expiresAt: { gte: new Date() }, // not expired
        },
    });
    if (!otpRecord) {
        throw new ErrorHandler_1.default("Token is invalid or has expired", 400);
    }
    // Hash new password
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    // Update user password
    await prisma_1.prisma.user.update({
        where: { id: payload.sub },
        data: { passwordHash: hashedPassword },
    });
    // Delete the token from database (cannot be reused)
    await prisma_1.prisma.otpCode.delete({ where: { id: otpRecord.id } });
    res.status(200).json({
        success: true,
        message: "Password successfully reset. You can now login.",
    });
});
//# sourceMappingURL=auth.controller.js.map