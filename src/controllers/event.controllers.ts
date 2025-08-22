import { Request, Response } from "express";
import catchAsync from "../middlewares/catchAsync";
import ErrorHandler from "../utils/ErrorHandler";
import { AuthRequest } from "../middlewares/isAuthenticated";
import {
  createEventSchema,
  updateEventSchema,
} from "../validators/event.schema";
import {
  createEventService,
  deleteAttachmentByIdService,
  deleteEventByIdService,
  getAllEventsService,
  getEventByIdService,
  getMyEventsService,
  updateEventByIdService,
} from "../services/event.service";

export const createEvent = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user;
    if (!userId) throw new ErrorHandler("Unauthorized", 401);

    // Ensure thumbnail exists
    const thumbnailFile = (
      req.files as Record<string, Express.Multer.File[]>
    )?.["thumbnail"]?.[0];
    if (!thumbnailFile) throw new ErrorHandler("Thumbnail is required", 400);

    // Put thumbnail path in body
    req.body.thumbnail = thumbnailFile.path;

    // Validate request
    const parseResult = createEventSchema.safeParse(req.body);
    if (!parseResult.success) {
      const messages = parseResult.error.errors
        .map((e) => e.message)
        .join(", ");
      throw new ErrorHandler(messages, 400);
    }

    // Call service
    const event = await createEventService({
      userId,
      data: parseResult.data,
      files: req.files as Record<string, Express.Multer.File[]>,
    });

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: event,
    });
  }
);

export const getAllEvents = catchAsync(async (req: Request, res: Response) => {
  const { page = "1", limit = "10", filterBy, search } = req.query;

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 10;

  const { events, total } = await getAllEventsService(
    pageNum,
    limitNum,
    filterBy as string,
    search as string
  );

  if (!events || events.length === 0) {
    throw new ErrorHandler("No events found", 404);
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


export const getEventById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw new ErrorHandler("Event ID is required", 400);
  }

  const event = await getEventByIdService(id);

  if (!event) {
    throw new ErrorHandler("Event not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Event fetched successfully",
    data: event,
  });
});

export const updateEventById = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const eventId = req.params.id;
    const userId = req.user;

    if (!eventId) throw new ErrorHandler("Event ID is required", 400);
    if (!userId) throw new ErrorHandler("Unauthorized", 401);

    // Check where event is exsist
    const event = await getEventByIdService(eventId);
    if (!event) throw new ErrorHandler("Event not found", 404);

    const parseResult = updateEventSchema.safeParse(req.body);
    if (!parseResult.success) {
      const messages = parseResult.error.errors
        .map((e) => e.message)
        .join(", ");
      throw new ErrorHandler(messages, 400);
    }

    const updatedEvent = await updateEventByIdService({
      eventId,
      userId,
      data: parseResult.data,
      files: req.files as Record<string, Express.Multer.File[]>,
    });

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
    if (!userId) {
      throw new ErrorHandler("Unauthorized", 401);
    }

    const result = await deleteEventByIdService(eventId, userId);

    if (!result) {
      throw new ErrorHandler("Event not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  }
);

export const getMyEvents = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user;
    if (!userId) {
      throw new ErrorHandler("Unauthorized", 401);
    }

    const { page = "1", limit = "10", filterBy, search } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;

    const { events, total } = await getMyEventsService(
      userId,
      pageNum,
      limitNum,
      filterBy as string,
      search as string
    );

    if (!events || events.length === 0) {
      throw new ErrorHandler("No events found for this user", 404);
    }

    res.status(200).json({
      success: true,
      message: "Your events fetched successfully",
      count: events.length,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
      data: events,
    });
  }
);

export const deleteAttachmentById = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const attachmentId = req.params.id;
    const userId = req.user;

    if (!attachmentId) {
      throw new ErrorHandler("Attachment ID is required", 400);
    }
    if (!userId) {
      throw new ErrorHandler("Unauthorized", 401);
    }

    const result = await deleteAttachmentByIdService(attachmentId, userId);

    if (!result) {
      throw new ErrorHandler("Attachment not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Attachment deleted successfully",
    });
  }
);