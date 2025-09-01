import { Router } from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import * as participantController from "../controllers/participant.controllers";
import { isAuthorized } from "../middlewares/isAuthorized";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Participants
 *   description: Manage event participation (join, cancel, approve/reject)
 */

/**
 * @swagger
 * /participant:
 *   get:
 *     summary: Test Participants API
 *     tags: [Participants]
 *     responses:
 *       200:
 *         description: API running successfully
 */
router.get("/", (_req, res) => {
  res.send("participant API Running Successfully");
});

/**
 * @swagger
 * /participant/join:
 *   post:
 *     summary: Request to join an event
 *     tags: [Participants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *             properties:
 *               eventId:
 *                 type: string
 *                 description: The ID of the event to join
 *     responses:
 *       201:
 *         description: Join request created
 */
router.post(
  "/join",
  isAuthenticated,
  isAuthorized(["PARTICIPANT"]),
  participantController.joinEvent
);

/**
 * @swagger
 * /participant/{participantId}/status:
 *   put:
 *     summary: Update participant request status (approve/reject)
 *     tags: [Participants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: participantId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the participant request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *     responses:
 *       200:
 *         description: Participant status updated
 */
router.put(
  "/:participantId/status",
  isAuthenticated,
  isAuthorized(["ORGANIZER"]),
  participantController.updateParticipantStatus
);

/**
 * @swagger
 * /participant/{participantId}:
 *   delete:
 *     summary: Cancel a join request (participant only)
 *     tags: [Participants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: participantId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the participant request
 *     responses:
 *       200:
 *         description: Request cancelled successfully
 */
router.delete(
  "/:participantId",
  isAuthenticated,
  isAuthorized(["PARTICIPANT"]),
  participantController.cancelParticipantRequest
);

/**
 * @swagger
 * /participant/my-requests:
 *   get:
 *     summary: Get my participation requests
 *     tags: [Participants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *     responses:
 *       200:
 *         description: List of my participant requests
 */
router.get(
  "/my-requests",
  isAuthenticated,
  isAuthorized(["PARTICIPANT"]),
  participantController.getMyParticipants
);

/**
 * @swagger
 * /participant/related/organizer:
 *   get:
 *     summary: Get participants for events owned by the organizer
 *     tags: [Participants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *     responses:
 *       200:
 *         description: List of participant requests for organizer’s events
 */
router.get(
  "/related/organizer",
  isAuthenticated,
  isAuthorized(["ORGANIZER"]),
  participantController.getParticipantsForOrganizer
);

export default router;
