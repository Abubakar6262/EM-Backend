"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAttachmentById = exports.getMyEvents = exports.deleteEventById = exports.updateEventById = exports.getEventById = exports.getAllEvents = exports.createEvent = void 0;
const catchAsync_1 = __importDefault(require("../middlewares/catchAsync"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const event_schema_1 = require("../validators/event.schema");
const event_service_1 = require("../services/event.service");
exports.createEvent = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user;
    if (!userId)
        throw new ErrorHandler_1.default("Unauthorized", 401);
    // Ensure thumbnail exists
    const thumbnailFile = req.files?.["thumbnail"]?.[0];
    if (!thumbnailFile)
        throw new ErrorHandler_1.default("Thumbnail is required", 400);
    // Put thumbnail path in body
    req.body.thumbnail = thumbnailFile.path;
    // Validate request
    const parseResult = event_schema_1.createEventSchema.safeParse(req.body);
    if (!parseResult.success) {
        const messages = parseResult.error.errors
            .map((e) => e.message)
            .join(", ");
        throw new ErrorHandler_1.default(messages, 400);
    }
    // Call service
    const event = await (0, event_service_1.createEventService)({
        userId,
        data: parseResult.data,
        files: req.files,
    });
    res.status(201).json({
        success: true,
        message: "Event created successfully",
        data: event,
    });
});
exports.getAllEvents = (0, catchAsync_1.default)(async (req, res) => {
    const { page = "1", limit = "10", filterBy, search } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const { events, total } = await (0, event_service_1.getAllEventsService)(pageNum, limitNum, filterBy, search);
    if (!events || events.length === 0) {
        throw new ErrorHandler_1.default("No events found", 404);
    }
    res.status(200).json({
        success: true,
        message: "Events fetched successfully",
        count: events.length,
        pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        },
        data: events,
    });
});
exports.getEventById = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new ErrorHandler_1.default("Event ID is required", 400);
    }
    const event = await (0, event_service_1.getEventByIdService)(id);
    if (!event) {
        throw new ErrorHandler_1.default("Event not found", 404);
    }
    res.status(200).json({
        success: true,
        message: "Event fetched successfully",
        data: event,
    });
});
exports.updateEventById = (0, catchAsync_1.default)(async (req, res) => {
    const eventId = req.params.id;
    const userId = req.user;
    if (!eventId)
        throw new ErrorHandler_1.default("Event ID is required", 400);
    if (!userId)
        throw new ErrorHandler_1.default("Unauthorized", 401);
    // Check where event is exsist
    const event = await (0, event_service_1.getEventByIdService)(eventId);
    if (!event)
        throw new ErrorHandler_1.default("Event not found", 404);
    const parseResult = event_schema_1.updateEventSchema.safeParse(req.body);
    if (!parseResult.success) {
        const messages = parseResult.error.errors
            .map((e) => e.message)
            .join(", ");
        throw new ErrorHandler_1.default(messages, 400);
    }
    const updatedEvent = await (0, event_service_1.updateEventByIdService)({
        eventId,
        userId,
        data: parseResult.data,
        files: req.files,
    });
    res.status(200).json({
        success: true,
        message: "Event updated successfully",
        data: updatedEvent,
    });
});
exports.deleteEventById = (0, catchAsync_1.default)(async (req, res) => {
    const eventId = req.params.id;
    const userId = req.user;
    if (!eventId) {
        throw new ErrorHandler_1.default("Event ID is required", 400);
    }
    if (!userId) {
        throw new ErrorHandler_1.default("Unauthorized", 401);
    }
    const result = await (0, event_service_1.deleteEventByIdService)(eventId, userId);
    if (!result) {
        throw new ErrorHandler_1.default("Event not found", 404);
    }
    res.status(200).json({
        success: true,
        message: "Event deleted successfully",
    });
});
exports.getMyEvents = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user;
    if (!userId) {
        throw new ErrorHandler_1.default("Unauthorized", 401);
    }
    const events = await (0, event_service_1.getMyEventsService)(userId);
    if (!events || events.length === 0) {
        throw new ErrorHandler_1.default("No events found for this user", 404);
    }
    res.status(200).json({
        success: true,
        message: "User events fetched successfully",
        count: events.length,
        data: events,
    });
});
exports.deleteAttachmentById = (0, catchAsync_1.default)(async (req, res) => {
    const attachmentId = req.params.id;
    const userId = req.user;
    if (!attachmentId) {
        throw new ErrorHandler_1.default("Attachment ID is required", 400);
    }
    if (!userId) {
        throw new ErrorHandler_1.default("Unauthorized", 401);
    }
    const result = await (0, event_service_1.deleteAttachmentByIdService)(attachmentId, userId);
    if (!result) {
        throw new ErrorHandler_1.default("Attachment not found", 404);
    }
    res.status(200).json({
        success: true,
        message: "Attachment deleted successfully",
    });
});
//# sourceMappingURL=event.controllers.js.map