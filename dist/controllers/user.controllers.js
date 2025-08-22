"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePassword = exports.updateUserRole = exports.updateProfilePic = exports.updateUserInfo = exports.getAllUsers = exports.getMe = void 0;
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const user_schema_1 = require("../validators/user.schema");
const catchAsync_1 = __importDefault(require("../middlewares/catchAsync"));
const auth_schema_1 = require("../validators/auth.schema");
const user_services_1 = require("../services/user.services");
// get current user information
exports.getMe = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user; // from authMiddleware
    if (!userId) {
        throw new ErrorHandler_1.default("Unauthorized", 401);
    }
    const user = await (0, user_services_1.getMeService)(userId);
    res.status(200).json({
        success: true,
        user,
    });
});
// get all users
exports.getAllUsers = (0, catchAsync_1.default)(async (req, res) => {
    const { page = "1", limit = "10", search } = req.query;
    const userId = req.user;
    if (!userId) {
        throw new ErrorHandler_1.default("Unauthorized", 401);
    }
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const result = await (0, user_services_1.getAllUsersService)(pageNum, limitNum, search);
    res.json({
        success: true,
        ...result, // includes users, totalUsers, totalPages, currentPage
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
    const user = await (0, user_services_1.updateUserInfoService)(userId, fullName, phone);
    res.status(200).json({
        success: true,
        user,
    });
});
// update user profile pic
exports.updateProfilePic = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user;
    if (!userId)
        throw new ErrorHandler_1.default("Unauthorized", 401);
    if (!req.file)
        throw new ErrorHandler_1.default("No file uploaded", 400);
    const newImageUrl = req.file.path;
    const updatedUser = await (0, user_services_1.updateProfilePicService)(userId, newImageUrl);
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
    const updatedUser = await (0, user_services_1.updateUserRoleService)(user.id, role);
    res.status(200).json({
        success: true,
        message: "User role updated successfully",
        user: updatedUser,
    });
});
// update user password
exports.updatePassword = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user;
    if (!userId)
        throw new ErrorHandler_1.default("Unauthorized", 401);
    // Validate input
    const parsed = auth_schema_1.updatePasswordSchema.parse(req.body);
    const { newPassword } = parsed;
    const { oldPassword } = req.body;
    await (0, user_services_1.updatePasswordService)(userId, oldPassword, newPassword);
    res.status(200).json({
        success: true,
        message: "Password updated successfully",
    });
});
//# sourceMappingURL=user.controllers.js.map