"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEventSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
exports.createEventSchema = zod_1.z
    .object({
    // Required
    title: zod_1.z.string().min(3, "Title must be at least 3 characters"),
    description: zod_1.z
        .string()
        .min(10, "Description must be at least 10 characters"),
    type: zod_1.z.nativeEnum(client_1.EventType, {
        errorMap: () => ({ message: "Type must be ONLINE or ONSITE" }),
    }),
    contactInfo: zod_1.z.string().min(3, "Contact info is required"),
    // ✅ Thumbnail required
    thumbnail: zod_1.z.string({
        required_error: "Thumbnail is required",
        invalid_type_error: "Thumbnail must be a string (file path/url)",
    }),
    // Optional (nullable in DB)
    totalSeats: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .optional()
        .transform((val) => val !== undefined && val !== null
        ? typeof val === "string"
            ? parseInt(val, 10)
            : val
        : undefined),
    // Venue → required only if ONSITE
    venue: zod_1.z
        .string()
        .transform((val) => (val === "" ? undefined : val))
        .optional(),
    // JoinLink → required only if ONLINE
    joinLink: zod_1.z
        .string()
        .transform((val) => (val === "" ? undefined : val))
        .optional(),
    // Dates
    startAt: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid start date",
    }),
    endAt: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid end date",
    }),
    // Hosts
    hosts: zod_1.z
        .union([
        zod_1.z.string().transform((val) => {
            try {
                return JSON.parse(val);
            }
            catch {
                return [];
            }
        }),
        zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string().min(2, "Host name must be at least 2 characters"),
            email: zod_1.z.string().email("Invalid email").optional(),
            phone: zod_1.z.string().optional(),
            userId: zod_1.z.string().uuid("Invalid userId").optional(),
        })),
    ])
        .optional(),
    // Organizer IDs
    organizerIds: zod_1.z
        .union([
        zod_1.z.string().transform((val) => {
            try {
                return JSON.parse(val);
            }
            catch {
                return [];
            }
        }),
        zod_1.z.array(zod_1.z.string().uuid("Invalid organizer id")),
    ])
        .optional(),
})
    // Extra refinements
    .refine((data) => (data.type === "ONSITE" ? !!data.venue : true), {
    message: "Venue is required for onsite events",
    path: ["venue"],
})
    .refine((data) => {
    if (data.type === "ONLINE") {
        if (!data.joinLink)
            return false;
        try {
            new URL(data.joinLink);
            return true;
        }
        catch {
            return false;
        }
    }
    return true;
}, {
    message: "Join link must be a valid URL",
    path: ["joinLink"],
})
    .refine((data) => new Date(data.endAt) > new Date(data.startAt), {
    message: "End date must be after start date",
    path: ["endAt"],
});
//# sourceMappingURL=event.schema.js.map