"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEventSchema = void 0;
const zod_1 = require("zod");
exports.createEventSchema = zod_1.z.object({
    title: zod_1.z.string().min(3),
    description: zod_1.z.string().min(10),
    hosts: zod_1.z.array(zod_1.z.string()).optional(),
    totalSeats: zod_1.z.number().int().positive().optional(),
    type: zod_1.z.enum(["onsite", "online"]),
    venue: zod_1.z.string().optional(),
    joinLink: zod_1.z.string().url().optional(),
    startAt: zod_1.z.string(),
    endAt: zod_1.z.string(),
    contactInfo: zod_1.z.string().min(3),
    organizerIds: zod_1.z.array(zod_1.z.string()).optional(),
});
//# sourceMappingURL=event.schema.js.map