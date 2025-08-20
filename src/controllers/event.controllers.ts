import { Request, Response } from "express";
import catchAsync from "../middlewares/catchAsync";
import ErrorHandler from "../utils/ErrorHandler";
import { AuthRequest } from "../middlewares/isAuthenticated";
import { prisma } from "../services/prisma";
import {
  createEventSchema,
  updateEventSchema,
} from "../validators/event.schema";

export const createEvent = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user;
    if (!userId) {
      throw new ErrorHandler("Unauthorized", 401);
    }

    // Ensure thumbnail exists
    const thumbnailFile = (req.files as any)?.["thumbnail"]?.[0];
    if (!thumbnailFile) {
      throw new ErrorHandler("Thumbnail is required", 400);
    }

    // Put thumbnail into body before validation
    req.body.thumbnail = thumbnailFile.path;

    // Validate request body
    const parseResult = createEventSchema.safeParse(req.body);
    if (!parseResult.success) {
      const messages = parseResult.error.errors
        .map((e) => e.message)
        .join(", ");
      throw new ErrorHandler(messages, 400);
    }

    const {
      title,
      description,
      hosts,
      totalSeats,
      type,
      venue,
      joinLink,
      startAt,
      endAt,
      contactInfo,
      thumbnail,
    } = parseResult.data;

    // Create Event first with thumbnail
    const event = await prisma.event.create({
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
        let hostRecord = await prisma.host.findUnique({
          where: { email: host.email ?? "" },
        });

        if (!hostRecord) {
          hostRecord = await prisma.host.create({
            data: {
              name: host.name,
              email: host.email || null,
              phone: host.phone || null,
              userId: host.userId || null,
            },
          });
        }

        // Connect host to event
        await prisma.event.update({
          where: { id: event.id },
          data: {
            hosts: {
              connect: { id: hostRecord.id },
            },
          },
        });
      }
    }

    // Handle optional media attachments
    const mediaFiles = (req.files as any)?.["media"] || [];
    if (mediaFiles.length > 0) {
      const attachments = mediaFiles.map((file: Express.Multer.File) => ({
        url: file.path, // e.g., Cloudinary URL
        type: file.mimetype.split("/")[0],
        eventId: event.id,
      }));

      await prisma.attachment.createMany({ data: attachments });
    }

    // Return response
    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: await prisma.event.findUnique({
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
      }),
    });
  }
);

export const getAllEvents = catchAsync(async (req: Request, res: Response) => {
  const events = await prisma.event.findMany({
    where: {
      isDeleted: false,
    },
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
    throw new ErrorHandler("No events found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Events fetched successfully",
    count: events.length,
    data: events,
  });
});

export const getEventById = catchAsync(async (req: Request, res: Response) => {
  const eventId = req.params.id;
  if (!eventId) {
    throw new ErrorHandler("Event ID is required", 400);
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId, isDeleted: false },
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

  if (!event) {
    throw new ErrorHandler("Event not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Event details fetched successfully",
    data: event,
  });
});

export const updateEventById = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const eventId = req.params.id;
    const userId = req.user;
    if (!eventId) {
      throw new ErrorHandler("Event ID is required", 400);
    }
    if (!userId) {
      throw new ErrorHandler("Unauthorized", 401);
    }

    // Validate request body (partial update)
    const parseResult = updateEventSchema.safeParse(req.body);
    if (!parseResult.success) {
      const messages = parseResult.error.errors
        .map((e) => e.message)
        .join(", ");
      throw new ErrorHandler(messages, 400);
    }

    const {
      title,
      description,
      hosts,
      totalSeats,
      type,
      venue,
      joinLink,
      startAt,
      endAt,
      contactInfo,
      thumbnail,
    } = parseResult.data;

    // Update Event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId, organizers: { some: { id: userId } } },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(totalSeats !== undefined && { totalSeats }),
        ...(type && { type }),
        ...(venue && { venue }),
        ...(joinLink && { joinLink }),
        ...(startAt && { startAt: new Date(startAt) }),
        ...(endAt && { endAt: new Date(endAt) }),
        ...(contactInfo && { contactInfo }),
        ...(thumbnail && { thumbnail }),
      },
      include: {
        hosts: true,
        organizers: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        attachments: true,
      },
    });

    // Handle hosts
    if (hosts && hosts.length > 0) {
      for (const host of hosts) {
        let hostRecord = await prisma.host.findUnique({
          where: { email: host.email ?? "" },
        });

        if (!hostRecord) {
          hostRecord = await prisma.host.create({
            data: {
              name: host.name,
              email: host.email || null,
              phone: host.phone || null,
              userId: host.userId || null,
            },
          });
        }

        // Connect host to event
        await prisma.event.update({
          where: { id: updatedEvent.id },
          data: {
            hosts: {
              connect: { id: hostRecord.id },
            },
          },
        });
      }
    }

    const mediaFiles = (req.files as any)?.["media"] || [];
    if (mediaFiles.length > 0) {
      const attachments = mediaFiles.map((file: Express.Multer.File) => ({
        url: file.path, // Cloudinary URL
        type: file.mimetype.split("/")[0],
        eventId: updatedEvent.id,
      }));

      await prisma.attachment.createMany({ data: attachments });
    }

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: updatedEvent,
    });
  }
);

export const deleteEventById = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const eventId = req.params.id;
    const userId = req.user;
    if (!eventId) {
      throw new ErrorHandler("Event ID is required", 400);
    }

    const event = await prisma.event.findUnique({ where: { id: eventId, organizers: { some: { id: userId } } } });
    if (!event) {
      throw new ErrorHandler("Event not found", 404);
    }

    await prisma.event.update({
      where: { id: eventId },
      data: {
        isDeleted: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  }
);