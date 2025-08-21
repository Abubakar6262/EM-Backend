import { Response } from "express";
import catchAsync from "../middlewares/catchAsync";
import { AuthRequest } from "../middlewares/isAuthenticated";
import * as participantService from "../services/participant.services";
import ErrorHandler from "../utils/ErrorHandler";

export const joinEvent = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user;
    const { eventId } = req.body;

    if (!userId) return new ErrorHandler("Unauthorized", 401);
    if (!eventId) return new ErrorHandler("Event ID is required", 400);

    const participant = await participantService.joinEvent(userId, eventId);
    res.status(201).json({ success: true, data: participant });
  
})

export const updateParticipantStatus = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user;
    const { participantId } = req.params;
    const { status } = req.body; // APPROVED or REJECTED

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return new ErrorHandler("Invalid status value", 400);
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
