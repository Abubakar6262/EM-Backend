"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserInfo = exports.getMe = void 0;
const prisma_1 = require("../services/prisma");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const user_schema_1 = require("../validators/user.schema");
// get current user information
const getMe = async (req, res, next) => {
    try {
        const userId = req.user; // from authMiddleware
        if (!userId)
            throw new ErrorHandler_1.default("Unauthorized", 401);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, fullName: true, role: true },
        });
        if (!user)
            throw new ErrorHandler_1.default("User not found", 404);
        res.json({ success: true, user });
    }
    catch (err) {
        next(err);
    }
};
exports.getMe = getMe;
// update user information
const updateUserInfo = async (req, res, next) => {
    try {
        const userId = req.user;
        if (!userId)
            throw new ErrorHandler_1.default("Unauthorized", 401);
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
        res.json({ success: true, user });
    }
    catch (err) {
        next(err);
    }
};
exports.updateUserInfo = updateUserInfo;
//# sourceMappingURL=user.controllers.js.map