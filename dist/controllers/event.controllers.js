"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllEvents = exports.createEvent = void 0;
const catchAsync_1 = __importDefault(require("../middlewares/catchAsync"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const prisma_1 = require("../services/prisma");
const event_schema_1 = require("../validators/event.schema");
exports.createEvent = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user;
    if (!userId) {
        throw new ErrorHandler_1.default("Unauthorized", 401);
    }
    // ✅ Ensure thumbnail exists
    const thumbnailFile = req.files?.["thumbnail"]?.[0];
    if (!thumbnailFile) {
        throw new ErrorHandler_1.default("Thumbnail is required", 400);
    }
    // Put thumbnail into body before validation
    req.body.thumbnail = thumbnailFile.path;
    // Validate request body
    const parseResult = event_schema_1.createEventSchema.safeParse(req.body);
    if (!parseResult.success) {
        const messages = parseResult.error.errors
            .map((e) => e.message)
            .join(", ");
        throw new ErrorHandler_1.default(messages, 400);
    }
    const { title, description, hosts, totalSeats, type, venue, joinLink, startAt, endAt, contactInfo, thumbnail, } = parseResult.data;
    // ✅ Create Event first with thumbnail
    const event = await prisma_1.prisma.event.create({
        data: {
            title,
            description,
            totalSeats: totalSeats ?? null,
            type,
            venue,
            joinLink,
            startAt: new Date(startAt),
            endAt: new Date(endAt),
            contactInfo,
            thumbnail, // <-- required
            organizers: {
                connect: { id: userId }, // connect current user as organizer
            },
        },
        include: {
            hosts: true,
            organizers: true,
        },
    });
    // Add hosts
    if (hosts && hosts.length > 0) {
        for (const host of hosts) {
            let hostRecord = await prisma_1.prisma.host.findUnique({
                where: { email: host.email ?? "" },
            });
            if (!hostRecord) {
                hostRecord = await prisma_1.prisma.host.create({
                    data: {
                        name: host.name,
                        email: host.email || null,
                        phone: host.phone || null,
                        userId: host.userId || null,
                    },
                });
            }
            // Connect host to event
            await prisma_1.prisma.event.update({
                where: { id: event.id },
                data: {
                    hosts: {
                        connect: { id: hostRecord.id },
                    },
                },
            });
        }
    }
    // ✅ Handle optional media attachments
    const mediaFiles = req.files?.["media"] || [];
    if (mediaFiles.length > 0) {
        const attachments = mediaFiles.map((file) => ({
            url: file.path, // e.g., Cloudinary URL
            type: file.mimetype.split("/")[0],
            eventId: event.id,
        }));
        await prisma_1.prisma.attachment.createMany({ data: attachments });
    }
    // Return response
    res.status(201).json({
        success: true,
        message: "Event created successfully",
        data: await prisma_1.prisma.event.findUnique({
            where: { id: event.id },
            include: {
                hosts: true,
                organizers: true,
                attachments: true,
            },
        }),
    });
});
exports.getAllEvents = (0, catchAsync_1.default)(async (req, res) => {
    const events = await prisma_1.prisma.event.findMany({
        include: {
            hosts: true,
            organizers: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                },
            },
            attachments: true,
        },
        orderBy: {
            startAt: "asc", // earliest first
        },
    });
    if (!events || events.length === 0) {
        throw new ErrorHandler_1.default("No events found", 404);
    }
    res.status(200).json({
        success: true,
        message: "Events fetched successfully",
        count: events.length,
        data: events,
    });
});
//# sourceMappingURL=event.controllers.js.map