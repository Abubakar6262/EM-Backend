import { Response } from "express";
import catchAsync from "../middlewares/catchAsync";
import { AuthRequest } from "../middlewares/isAuthenticated";
import * as participantService from "../services/participant.services";
import ErrorHandler from "../utils/ErrorHandler";

export const joinEvent = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user;
  const { eventId } = req.body;

  if (!userId) return new ErrorHandler("Unauthorized", 401);
  if (!eventId) return new ErrorHandler("Event ID is required", 400);

  const participant = await participantService.joinEvent(userId, eventId);
  res.status(201).json({ success: true, data: participant });
});

export const updateParticipantStatus = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user;
    const { participantId } = req.params;
    const { status } = req.body; // "APPROVED" or "REJECTED"

    if (!["APPROVED", "REJECTED"].includes(status)) {
      throw new ErrorHandler("Invalid status value", 400);
    }

    if (!userId) {
      throw new ErrorHandler("Unauthorized", 401);
    }

    const updatedParticipant = await participantService.updateParticipantStatus(
      userId,
      participantId,
      status
    );

    res.status(200).json({
      success: true,
      data: updatedParticipant,
      message: `Participant request has been ${status.toLowerCase()}`,
    });
  }
);

export const cancelParticipantRequest = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user;
    const { participantId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await participantService.deleteParticipant(
      userId,
      participantId
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  }
);

export const getMyParticipants = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { page = "1", limit = "10", status } = req.query;
    const userId = req.user;

    if (!userId) {
      throw new ErrorHandler("Unauthorized", 401);
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;

    const result = await participantService.getMyParticipantsService(
      userId,
      pageNum,
      limitNum,
      status as "PENDING" | "APPROVED" | "REJECTED" | undefined
    );

    res.json({
      success: true,
      ...result, // participants, total, totalPages, currentPage
    });
  }
);

export const getParticipantsForOrganizer = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { page = "1", limit = "10", status = "PENDING" } = req.query;
    const userId = req.user; // Organizer's userId

    if (!userId) {
      throw new ErrorHandler("Unauthorized", 401);
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;

    const result = await participantService.getParticipantsForOrganizerService(
      userId,
      pageNum,
      limitNum,
      status as string
    );

    res.json({
      success: true,
      ...result, // { participants, total, totalPages, currentPage }
    });
  }
);
