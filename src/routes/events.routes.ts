import { Router } from "express";
import * as EventControllers from "../controllers/event.controllers";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { isAuthorized } from "../middlewares/isAuthorized";
import { upload } from "../utils/uploadToCloudinary";
const router = Router();

// test events api route
router.get("/", (_req, res) => {
  res.send("Events API Running Successfully");
});

// create event route
router.post(
  "/create",
  isAuthenticated,
  isAuthorized(["ORGANIZER"]),
  upload.fields([
    { name: "thumbnail", maxCount: 1 }, // required
    { name: "media", maxCount: 10 }, // optional
  ]),
  EventControllers.createEvent
);

// get all events route
router.get("/all", EventControllers.getAllEvents);

// get event by id route
router.get("/:id", EventControllers.getEventById);

// update event route
router.put(
  "/update/:id",
  isAuthenticated,
  isAuthorized(["ORGANIZER"]),
  upload.fields([
    { name: "thumbnail", maxCount: 1 }, // optional
    { name: "media", maxCount: 10 }, // optional
  ]),
  EventControllers.updateEventById
);

// delete event route
router.delete(
  "/delete/:id",
  isAuthenticated,
  isAuthorized(["ORGANIZER"]),
  EventControllers.deleteEventById
);

export default router;
