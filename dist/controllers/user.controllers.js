"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePassword = exports.updateUserRole = exports.updateProfilePic = exports.updateUserInfo = exports.getAllUsers = exports.getMe = void 0;
const prisma_1 = require("../services/prisma");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const user_schema_1 = require("../validators/user.schema");
const catchAsync_1 = __importDefault(require("../middlewares/catchAsync"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_schema_1 = require("../validators/auth.schema");
// get current user information
exports.getMe = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user; // from authMiddleware
    if (!userId) {
        throw new ErrorHandler_1.default("Unauthorized", 401);
    }
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, fullName: true, role: true },
    });
    if (!user) {
        throw new ErrorHandler_1.default("User not found", 404);
    }
    res.json({
        success: true,
        user,
    });
});
// get all users
exports.getAllUsers = (0, catchAsync_1.default)(async (req, res) => {
    const users = await prisma_1.prisma.user.findMany({
        select: { id: true, email: true, fullName: true, role: true },
    });
    res.json({
        success: true,
        users,
    });
});
// update user information
exports.updateUserInfo = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user;
    if (!userId) {
        throw new ErrorHandler_1.default("Unauthorized", 401);
    }
    // Validate input with Zod
    const { fullName, phone } = user_schema_1.updateUserSchema.parse(req.body);
    const user = await prisma_1.prisma.user.update({
        where: { id: userId },
        data: { fullName, phone },
        select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            role: true,
        },
    });
    if (!user) {
        throw new ErrorHandler_1.default("User not found", 404);
    }
    res.json({ success: true, user });
});
// update user profile pic
exports.updateProfilePic = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user;
    if (!userId)
        throw new ErrorHandler_1.default("Unauthorized", 401);
    if (!req.file)
        throw new ErrorHandler_1.default("No file uploaded", 400);
    const imageUrl = req.file.path;
    const updatedUser = await prisma_1.prisma.user.update({
        where: { id: userId },
        data: { profilePic: imageUrl },
        select: { id: true, email: true, fullName: true, profilePic: true },
    });
    res.status(200).json({
        success: true,
        message: "Profile picture updated successfully",
        profilePic: updatedUser.profilePic,
    });
});
// update user role
exports.updateUserRole = (0, catchAsync_1.default)(async (req, res) => {
    const { role, user } = req.body;
    if (!role || !user) {
        throw new ErrorHandler_1.default("Role and User are required in body", 400);
    }
    // Update user role
    const updatedUser = await prisma_1.prisma.user.update({
        where: { id: user.id },
        data: { role },
        select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
        },
    });
    if (!updatedUser)
        throw new ErrorHandler_1.default("User not found", 404);
    res.status(200).json({
        success: true,
        message: "User role updated successfully",
        user: updatedUser,
    });
});
// update user password
exports.updatePassword = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user;
    // Validate request body with Zod
    const parsed = auth_schema_1.updatePasswordSchema.parse(req.body);
    const { newPassword } = parsed;
    const { oldPassword } = req.body;
    if (!userId) {
        throw new ErrorHandler_1.default("Unauthorized", 401);
    }
    // Get user from DB
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new ErrorHandler_1.default("User not found", 404);
    }
    if (!user.passwordHash) {
        throw new ErrorHandler_1.default("User has no password set", 400);
    }
    // Compare old password
    const isMatch = await bcryptjs_1.default.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
        throw new ErrorHandler_1.default("Old password is incorrect", 400);
    }
    // Hash and update new password
    const newPasswordHash = await bcryptjs_1.default.hash(newPassword, 10);
    await prisma_1.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
    });
    res.status(200).json({
        success: true,
        message: "Password updated successfully",
    });
});
//# sourceMappingURL=user.controllers.js.map