"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = void 0;
// user information schema
const zod_1 = require("zod");
exports.updateUserSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(3, "Full name must be at least 3 characters long"),
    phone: zod_1.z
        .string()
        .regex(/^03[0-9]{9}$/, "Phone number must be in format 03XXXXXXXXX")
        .min(11, "Phone number must be 11 digits")
        .max(11, "Phone number must be 11 digits")
        .optional(),
});
//# sourceMappingURL=user.schema.js.map