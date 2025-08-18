"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refreshToken = exports.login = exports.signup = void 0;
const prisma_1 = require("../services/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const jwt_1 = require("../utils/jwt");
const auth_schema_1 = require("../validators/auth.schema");
// import { string } from "zod";
const signup = async (req, res, next) => {
    try {
        const parsed = auth_schema_1.signupSchema.parse(req.body); // Zod validates input
        const { email, password, fullName } = parsed;
        if (!email || !password || !fullName) {
            throw new ErrorHandler_1.default("email, password, and fullName are required", 400);
        }
        const exists = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (exists)
            throw new ErrorHandler_1.default("Email already in use", 400);
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        await prisma_1.prisma.user.create({
            data: { email, passwordHash, fullName },
        });
        // const { accessToken, refreshToken, refreshExp } = await issueTokens(
        //   user.id
        // );
        // await prisma.refreshToken.create({
        //   data: { userId: user.id, token: refreshToken, expiresAt: refreshExp },
        // });
        // res.status(201).json({
        //   success: true,
        //   user: {
        //     id: user.id,
        //     email: user.email,
        //     fullName: user.fullName,
        //     role: user.role,
        //   },
        //   accessToken,
        //   refreshToken,
        // });
        res.status(201).json({
            success: true,
            message: "Account created. Please log in.",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.signup = signup;
const login = async (req, res, next) => {
    try {
        const parsed = auth_schema_1.loginSchema.parse(req.body); // Zod validates input
        const { email, password } = parsed;
        if (!email || !password)
            throw new ErrorHandler_1.default("email and password required", 400);
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash)
            throw new ErrorHandler_1.default("Invalid credentials", 401);
        const ok = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!ok)
            throw new ErrorHandler_1.default("Invalid credentials", 401);
        const { accessToken, refreshToken, refreshExp } = await (0, jwt_1.issueTokens)(user.id);
        await prisma_1.prisma.refreshToken.create({
            data: { userId: user.id, token: refreshToken, expiresAt: refreshExp },
        });
        // res.json({
        //   success: true,
        //   user: {
        //     id: user.id,
        //     email: user.email,
        //     fullName: user.fullName,
        //     role: user.role,
        //   },
        //   accessToken,
        //   refreshToken,
        // });
        res
            .cookie("accessToken", accessToken, {
            httpOnly: true, // JS can't read it → protects from XSS
            secure: true, // send only over HTTPS
            sameSite: "strict", // CSRF protection
            maxAge: 15 * 60 * 1000, // 15 min
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
    }
    catch (err) {
        next(err);
    }
};
exports.login = login;
const refreshToken = async (req, res, next) => {
    try {
        const oldRefreshToken = req.cookies.refreshToken;
        if (!oldRefreshToken)
            throw new ErrorHandler_1.default("No refresh token provided", 401);
        // verify refresh token signature & expiry
        const payload = (0, jwt_1.verifyRefresh)(oldRefreshToken);
        // check token exists in DB and is not revoked
        const stored = await prisma_1.prisma.refreshToken.findUnique({
            where: { token: oldRefreshToken },
        });
        if (!stored || stored.revokedAt !== null) {
            throw new ErrorHandler_1.default("Refresh token invalid", 401);
        }
        // revoke old refresh token
        await prisma_1.prisma.refreshToken.update({
            where: { token: oldRefreshToken },
            data: { revokedAt: new Date() },
        });
        // issue new tokens
        const { accessToken, refreshToken: newRefresh, refreshExp, } = await (0, jwt_1.issueTokens)(payload.sub);
        await prisma_1.prisma.refreshToken.create({
            data: { userId: payload.sub, token: newRefresh, expiresAt: refreshExp },
        });
        // set new cookies
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 1000 * 60 * 5, // 5m or match ENV.ACCESS_EXPIRES
        });
        res.cookie("refreshToken", newRefresh, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7d or match ENV.REFRESH_EXPIRES
        });
        res.json({ success: true, message: "Token refreshed" });
    }
    catch (err) {
        next(err);
    }
};
exports.refreshToken = refreshToken;
const logout = async (req, res, next) => {
    try {
        // console.log("request user ", (req as any).user);
        const userId = req.user; // from authMiddleware isAuthenticated
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        // revoke all active refresh tokens for this user
        await prisma_1.prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
        // clear cookies
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
        res.json({ success: true, message: "Logged out successfully" });
    }
    catch (err) {
        next(err);
    }
};
exports.logout = logout;
//# sourceMappingURL=auth.controller.js.map