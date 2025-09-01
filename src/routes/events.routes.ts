import { Router } from "express";
import * as EventControllers from "../controllers/event.controllers";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { isAuthorized } from "../middlewares/isAuthorized";
import { upload } from "../utils/uploadToCloudinary";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management & participation
 */

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Test Events API
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: API running successfully
 */
router.get("/", (_req, res) => {
  res.send("Events API Running Successfully");
});

/**
 * @swagger
 * /events/create:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - type
 *               - startAt
 *               - endAt
 *               - thumbnail
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               hosts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name: { type: string }
 *                     email: { type: string, format: email }
 *                     phone: { type: string }
 *                     userId: { type: string }
 *               totalSeats:
 *                 type: integer
 *                 nullable: true
 *               type:
 *                 type: string
 *                 enum: [ONLINE, ONSITE]
 *               venue:
 *                 type: string
 *               joinLink:
 *                 type: string
 *               startAt:
 *                 type: string
 *                 format: date-time
 *               endAt:
 *                 type: string
 *                 format: date-time
 *               contactInfo:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Event created successfully
 */
router.post(
  "/create",
  isAuthenticated,
  isAuthorized(["ORGANIZER"]),
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "media", maxCount: 10 },
  ]),
  EventControllers.createEvent
);

/**
 * @swagger
 * /events/all:
 *   get:
 *     summary: Get all events (with pagination & filters)
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: filterBy
 *         schema: { type: string, enum: [incoming, past, live] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [ONLINE, ONSITE] }
 *     responses:
 *       200:
 *         description: Events fetched successfully
 */
router.get("/all", EventControllers.getAllEvents);

/**
 * @swagger
 * /events/my-events:
 *   get:
 *     summary: Get my events (organizer only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: filterBy
 *         schema: { type: string, enum: [incoming, past, live] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [ONLINE, ONSITE] }
 *     responses:
 *       200:
 *         description: Organizer's events fetched successfully
 */
router.get(
  "/my-events",
  isAuthenticated,
  isAuthorized(["ORGANIZER"]),
  EventControllers.getMyEvents
);

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Get event details by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Event fetched successfully
 *       404:
 *         description: Event not found
 */
router.get("/:id", EventControllers.getEventById);

/**
 * @swagger
 * /events/update/{id}:
 *   put:
 *     summary: Update an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               hosts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name: { type: string }
 *                     email: { type: string, format: email }
 *               totalSeats: { type: integer }
 *               type: { type: string, enum: [ONLINE, ONSITE] }
 *               venue: { type: string }
 *               joinLink: { type: string }
 *               startAt: { type: string, format: date-time }
 *               endAt: { type: string, format: date-time }
 *               contactInfo: { type: string }
 *               thumbnail: { type: string, format: binary }
 *               media:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Event updated successfully
 */
router.put(
  "/update/:id",
  isAuthenticated,
  isAuthorized(["ORGANIZER"]),
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "media", maxCount: 10 },
  ]),
  EventControllers.updateEventById
);

/**
 * @swagger
 * /events/delete/{id}:
 *   delete:
 *     summary: Delete an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       404:
 *         description: Event not found
 */
router.delete(
  "/delete/:id",
  isAuthenticated,
  isAuthorized(["ORGANIZER"]),
  EventControllers.deleteEventById
);

/**
 * @swagger
 * /events/delete-attachment/{id}:
 *   delete:
 *     summary: Delete an event attachment
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Attachment deleted successfully
 *       404:
 *         description: Attachment not found
 */
router.delete(
  "/delete-attachment/:id",
  isAuthenticated,
  isAuthorized(["ORGANIZER"]),
  EventControllers.deleteAttachmentById
);

/**
 * @swagger
 * /events/dashboard/analysis:
 *   get:
 *     summary: Get organizer dashboard analytics
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data fetched successfully
 */
router.get(
  "/dashboard/analysis",
  isAuthenticated,
  isAuthorized(["ORGANIZER"]),
  EventControllers.getOrganizerDashboard
);

export default router;
