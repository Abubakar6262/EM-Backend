import { Response } from "express";
import catchAsync from "../middlewares/catchAsync";
import ErrorHandler from "../utils/ErrorHandler";
import { AuthRequest } from "../middlewares/isAuthenticated";
import { prisma } from "../services/prisma";

export const createEvent = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user;
    if (!userId) {
      throw new ErrorHandler("Unauthorized", 401);
    }

    const {
      title,
      description,
      hosts,
      totalSeats,
      type, // "onsite" | "online"
      venue,
      joinLink,
      startAt,
      endAt,
      contactInfo,
    } = req.body;

    // Validate required fields
    if (!title || !description || !type || !startAt || !endAt || !contactInfo) {
      throw new ErrorHandler("Missing required event fields", 400);
    }

    
    let hostsArray: string[] = [];
    if (hosts) {
      try {
        hostsArray = typeof hosts === "string" ? JSON.parse(hosts) : hosts;
      } catch {
        throw new ErrorHandler("Hosts must be a valid JSON array", 400);
      }
    }

    // Create Event first
    const event = await prisma.event.create({
      data: {
        title,
        description,
        hosts: hostsArray,
        totalSeats: totalSeats ? Number(totalSeats) : null,
        type,
        venue,
        joinLink,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        contactInfo,
        organizers: {
          connect: { id: userId }, // link organizer
        },
      },
    });

    // Handle multiple uploads (images/videos)
    if (req.files && Array.isArray(req.files)) {
      const attachments = (req.files as Express.Multer.File[]).map((file) => ({
        url: (file).path, // Cloudinary URL
        type: file.mimetype.split("/")[0], // "image" | "video"
        eventId: event.id,
      }));

      // Bulk insert attachments
      await prisma.attachment.createMany({
        data: attachments,
      });
    }

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: event,
    });
  }
);

