"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAttachmentByIdService = exports.getMyEventsService = exports.deleteEventByIdService = exports.getEventByIdService = exports.getAllEventsService = exports.updateEventByIdService = exports.createEventService = void 0;
const prisma_1 = require("../services/prisma");
const deleteImageFromCloudinary_1 = require("../utils/deleteImageFromCloudinary");
// Create Event Service
const createEventService = async ({ userId, data, files, }) => {
    const { title, description, hosts, totalSeats, type, venue, joinLink, startAt, endAt, contactInfo, thumbnail, } = data;
    // Create Event
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
            contactInfo: contactInfo || "",
            thumbnail,
            organizers: {
                connect: { id: userId },
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
            await prisma_1.prisma.event.update({
                where: { id: event.id },
                data: {
                    hosts: { connect: { id: hostRecord.id } },
                },
            });
        }
    }
    // Handle media attachments
    const mediaFiles = files?.["media"] || [];
    if (mediaFiles.length > 0) {
        const attachments = mediaFiles.map((file) => ({
            url: file.path,
            type: file.mimetype.split("/")[0],
            eventId: event.id,
        }));
        await prisma_1.prisma.attachment.createMany({ data: attachments });
    }
    // Return complete event with relations
    return prisma_1.prisma.event.findUnique({
        where: { id: event.id },
        include: {
            hosts: true,
            organizers: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                },
            },
            attachments: true,
        },
    });
};
exports.createEventService = createEventService;
// Update Event Service
const updateEventByIdService = async ({ eventId, userId, data, files, }) => {
    // Update event fields
    await prisma_1.prisma.event.update({
        where: {
            id: eventId,
            organizers: { some: { id: userId } },
        },
        data: {
            ...(data.title && { title: data.title }),
            ...(data.description && { description: data.description }),
            ...(data.totalSeats !== undefined && { totalSeats: data.totalSeats }),
            ...(data.type && { type: data.type }),
            ...(data.venue && { venue: data.venue }),
            ...(data.joinLink && { joinLink: data.joinLink }),
            ...(data.startAt && { startAt: new Date(data.startAt) }),
            ...(data.endAt && { endAt: new Date(data.endAt) }),
            ...(data.contactInfo && { contactInfo: data.contactInfo }),
            ...(data.thumbnail && { thumbnail: data.thumbnail }),
        },
    });
    // Handle hosts
    if (data.hosts && data.hosts.length > 0) {
        for (const host of data.hosts) {
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
            await prisma_1.prisma.event.update({
                where: { id: eventId },
                data: { hosts: { connect: { id: hostRecord.id } } },
            });
        }
    }
    // Handle attachments
    const mediaFiles = files?.["media"] || [];
    if (mediaFiles.length > 0) {
        const attachments = mediaFiles.map((file) => ({
            url: file.path,
            type: file.mimetype.split("/")[0],
            eventId: eventId,
        }));
        await prisma_1.prisma.attachment.createMany({ data: attachments });
    }
    // ✅ Refetch event to include new attachments & hosts
    const updatedEvent = await prisma_1.prisma.event.findUnique({
        where: { id: eventId },
        include: {
            hosts: true,
            organizers: { select: { id: true, email: true, fullName: true } },
            attachments: true,
        },
    });
    return updatedEvent;
};
exports.updateEventByIdService = updateEventByIdService;
// Get all events service
const getAllEventsService = async (page, limit, filterBy, search) => {
    const now = new Date();
    let where = { isDeleted: false };
    let orderBy = { startAt: "asc" };
    // 🔹 Apply filter
    switch (filterBy?.toLowerCase()) {
        case "incoming":
            where = { ...where, startAt: { gt: now } };
            orderBy = { startAt: "asc" };
            break;
        case "past":
            where = { ...where, endAt: { lt: now } };
            orderBy = { startAt: "desc" };
            break;
        case "live":
            where = { ...where, startAt: { lte: now }, endAt: { gte: now } };
            orderBy = { endAt: "asc" };
            break;
    }
    // 🔹 Apply search by title
    if (search) {
        where = {
            ...where,
            title: {
                contains: search,
                mode: "insensitive", // case-insensitive search
            },
        };
    }
    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
        prisma_1.prisma.event.findMany({
            where,
            skip,
            take: limit,
            include: {
                hosts: true,
                organizers: {
                    select: { id: true, fullName: true, email: true },
                },
                attachments: true,
            },
            orderBy,
        }),
        prisma_1.prisma.event.count({ where }),
    ]);
    return { events, total };
};
exports.getAllEventsService = getAllEventsService;
// Get event by ID service
const getEventByIdService = async (eventId) => {
    const event = await prisma_1.prisma.event.findUnique({
        where: { id: eventId, isDeleted: false },
        include: {
            hosts: true,
            organizers: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    role: true,
                },
            },
            attachments: true,
        },
    });
    return event;
};
exports.getEventByIdService = getEventByIdService;
// Delete Event Service
const deleteEventByIdService = async (eventId, userId) => {
    // Check if event exists and belongs to organizer
    const event = await prisma_1.prisma.event.findUnique({
        where: { id: eventId },
        include: { organizers: { select: { id: true } } },
    });
    if (!event) {
        return null; // event not found
    }
    const isOrganizer = event.organizers.some((org) => org.id === userId);
    if (!isOrganizer) {
        throw new Error("Unauthorized"); // will be handled in controller
    }
    // Soft delete
    await prisma_1.prisma.event.update({
        where: { id: eventId },
        data: { isDeleted: true },
    });
    return true;
};
exports.deleteEventByIdService = deleteEventByIdService;
// Get my Events
const getMyEventsService = async (userId, page, limit, filterBy, search) => {
    const now = new Date();
    let where = {
        isDeleted: false,
        organizers: { some: { id: userId } },
    };
    let orderBy = { startAt: "asc" };
    // 🔹 Apply filter
    switch (filterBy?.toLowerCase()) {
        case "incoming":
            where = { ...where, startAt: { gt: now } };
            orderBy = { startAt: "asc" };
            break;
        case "past":
            where = { ...where, endAt: { lt: now } };
            orderBy = { startAt: "desc" };
            break;
        case "live":
            where = { ...where, startAt: { lte: now }, endAt: { gte: now } };
            orderBy = { endAt: "asc" };
            break;
    }
    // 🔹 Apply search by title
    if (search) {
        where = {
            ...where,
            title: {
                contains: search,
                mode: "insensitive",
            },
        };
    }
    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
        prisma_1.prisma.event.findMany({
            where,
            skip,
            take: limit,
            include: {
                hosts: true,
                organizers: {
                    select: { id: true, fullName: true, email: true },
                },
                attachments: true,
            },
            orderBy,
        }),
        prisma_1.prisma.event.count({ where }),
    ]);
    return { events, total };
};
exports.getMyEventsService = getMyEventsService;
// Delete attachment
const deleteAttachmentByIdService = async (attachmentId, userId) => {
    // Check if attachment exists
    const attachment = await prisma_1.prisma.attachment.findUnique({
        where: { id: attachmentId },
    });
    if (!attachment) {
        return null; // attachment not found
    }
    // Check if user is authorized to delete
    const event = await prisma_1.prisma.event.findUnique({
        where: { id: attachment.eventId },
        include: { organizers: { select: { id: true } } },
    });
    if (!event) {
        throw new Error("Event not found");
    }
    const isOrganizer = event.organizers.some((org) => org.id === userId);
    if (!isOrganizer) {
        throw new Error("Unauthorized"); // will be handled in controller
    }
    // Delete attachment
    await prisma_1.prisma.attachment.delete({
        where: { id: attachmentId },
    });
    //   delete attachment from cloudinary
    await (0, deleteImageFromCloudinary_1.deleteImageFromCloudinary)(attachment.url);
    return true;
};
exports.deleteAttachmentByIdService = deleteAttachmentByIdService;
//# sourceMappingURL=event.service.js.map