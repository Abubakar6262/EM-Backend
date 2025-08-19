"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthorized = void 0;
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const prisma_1 = require("../services/prisma");
const isAuthorized = (roles) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                throw new ErrorHandler_1.default("Unauthorized", 401);
            }
            // req.user is userId
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: req.user },
                select: { role: true },
            });
            if (!user) {
                throw new ErrorHandler_1.default("User not found", 404);
            }
            if (!roles.includes(user.role)) {
                throw new ErrorHandler_1.default("Not authorized to access this resource", 403);
            }
            next();
        }
        catch (err) {
            next(err);
        }
    };
};
exports.isAuthorized = isAuthorized;
//# sourceMappingURL=isAuthorized.js.map