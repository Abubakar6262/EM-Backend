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
  upload.array("media", 10),
  EventControllers.createEvent
);

// get all events route
router.get("/all", (_req, res) => {
  res.send("List of all events");
});

// get event by id route
router.get("/:id", (_req, res) => {
  res.send("Event details");
});

// update event route
router.put("/:id", (_req, res) => {
  res.send("Event updated successfully");
});

// delete event route
router.delete("/:id", (_req, res) => {
  res.send("Event deleted successfully");
});

export default router;
