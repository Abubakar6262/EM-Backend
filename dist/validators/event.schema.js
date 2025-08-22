"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEventSchema = exports.createEventSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
// Base schema (pure object)
const baseEventSchema = zod_1.z.object({
    title: zod_1.z
        .string({ required_error: "Title is required" })
        .min(3, "Title must be at least 3 characters"),
    description: zod_1.z
        .string({ required_error: "Description is required" })
        .min(10, "Description must be at least 10 characters"),
    type: zod_1.z.nativeEnum(client_1.EventType, {
        errorMap: () => ({ message: "Type must be ONLINE or ONSITE" }),
    }),
    contactInfo: zod_1.z
        .string({ required_error: "Contact info is required" })
        .min(3, "Contact info must be at least 3 characters"),
    thumbnail: zod_1.z.string({
        required_error: "Thumbnail is required",
        invalid_type_error: "Thumbnail must be a string (file path/url)",
    }),
    totalSeats: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .optional()
        .transform((val) => val !== undefined && val !== null
        ? typeof val === "string"
            ? parseInt(val, 10)
            : val
        : undefined),
    venue: zod_1.z
        .string()
        .transform((val) => (val === "" ? undefined : val))
        .optional(),
    joinLink: zod_1.z
        .string()
        .transform((val) => (val === "" ? undefined : val))
        .optional(),
    startAt: zod_1.z
        .string({ required_error: "Start date is required" })
        .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid start date",
    }),
    endAt: zod_1.z
        .string({ required_error: "End date is required" })
        .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end date" }),
    hosts: zod_1.z
        .union([
        zod_1.z.string({ required_error: "Hosts are required" }).transform((val) => {
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
});
// Full schema for creation (with refinements)
exports.createEventSchema = baseEventSchema
    .refine((data) => (data.type === "ONSITE" ? !!data.venue : true), {
    message: "Venue is required for onsite events",
    path: ["venue"],
})
    .refine((data) => {
    if (data.type === "ONLINE") {
        if (!data.joinLink)
            return false; // required for ONLINE
        try {
            new URL(data.joinLink); // must be absolute URL
            return true;
        }
        catch {
            return false;
        }
    }
    return true; // skip validation for ONSITE
}, { message: "Join link must be a valid URL", path: ["joinLink"] })
    .refine((data) => new Date(data.endAt) > new Date(data.startAt), {
    message: "End date must be after start date",
    path: ["endAt"],
});
// Update schema → partial but required for some fields if provided
exports.updateEventSchema = baseEventSchema
    .partial()
    .refine((data) => data.type === "ONSITE" ? !!data.venue || data.venue === undefined : true, { message: "Venue is required for onsite events", path: ["venue"] })
    .refine((data) => {
    if (data.type === "ONLINE") {
        if (data.joinLink === undefined)
            return true; // skip if not updating joinLink
        try {
            new URL(data.joinLink);
            return true;
        }
        catch {
            return false;
        }
    }
    return true;
}, { message: "Join link must be a valid URL", path: ["joinLink"] })
    .refine((data) => {
    if (data.startAt && data.endAt) {
        return new Date(data.endAt) > new Date(data.startAt);
    }
    return true; // skip if not both provided
}, { message: "End date must be after start date", path: ["endAt"] });
//# sourceMappingURL=event.schema.js.map