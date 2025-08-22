"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const library_1 = require("@prisma/client/runtime/library");
const zod_1 = require("zod");
// Type guard: checks if error is a PrismaClientKnownRequestError
function isPrismaKnownError(error) {
    return error instanceof library_1.PrismaClientKnownRequestError;
}
const ErrorMiddleware = (err, _req, res, _next) => {
    let error = err;
    const statusCode = error?.statusCode || 500;
    const message = error?.message || "Internal Server Error";
    // Handle Zod validation errors
    if (error instanceof zod_1.ZodError) {
        const formattedErrors = {};
        error.errors.forEach((e) => {
            const field = e.path[0];
            if (!formattedErrors[field]) {
                formattedErrors[field] = [];
            }
            formattedErrors[field].push(e.message);
        });
        return res.status(400).json({
            success: false,
            errors: formattedErrors,
        });
    }
    // Handle Prisma errors (type-guarded)
    if (isPrismaKnownError(error)) {
        if (error.code === "P2002") {
            error = new ErrorHandler_1.default(`Duplicate value for field(s): ${error.meta?.target}`, 400);
        }
        else if (error.code === "P2025") {
            error = new ErrorHandler_1.default("Record not found", 404);
        }
    }
    else if (error instanceof library_1.PrismaClientValidationError) {
        error = new ErrorHandler_1.default("Invalid data sent to the database", 400);
    }
    // Handle JWT errors
    else if (error instanceof Error && error.name === "JsonWebTokenError") {
        error = new ErrorHandler_1.default("JSON Web Token is invalid", 400);
    }
    else if (error instanceof Error && error.name === "TokenExpiredError") {
        error = new ErrorHandler_1.default("JSON Web Token has expired", 400);
    }
    // Default handler
    res.status(error?.statusCode || statusCode).json({
        success: false,
        message: error?.message || message,
        ...(process.env.NODE_ENV === "development" && {
            stack: error?.stack,
        }),
    });
};
exports.default = ErrorMiddleware;
//# sourceMappingURL=error.middleware.js.map