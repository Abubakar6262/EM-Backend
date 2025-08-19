"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePasswordSchema = exports.loginSchema = exports.signupSchema = void 0;
const zod_1 = require("zod");
// Register User validation Schema
exports.signupSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email format"),
    fullName: zod_1.z.string().min(3, "Full name must be at least 3 characters long"),
    password: zod_1.z
        .string()
        .min(6, "Password must be at least 6 characters long")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[\W_]/, "Password must contain at least one special character"),
});
// Login user validation Schema
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email format"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters long"),
});
// update password validation schema
exports.updatePasswordSchema = zod_1.z.object({
    newPassword: zod_1.z
        .string()
        .min(6, "Password must be at least 6 characters long")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[\W_]/, "Password must contain at least one special character"),
});
//# sourceMappingURL=auth.schema.js.map