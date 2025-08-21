import { Router } from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import * as participantController from "../controllers/participant.controllers";
import { isAuthorized } from "../middlewares/isAuthorized";
const router = Router();

// test participant api route
router.get("/", (_req, res) => {
  res.send("participant API Running Successfully");
});

router.post(
  "/join",
  isAuthenticated,
  isAuthorized(["PARTICIPANT"]),
  participantController.joinEvent
);

router.put(
  "/:participantId/status",
  isAuthenticated,
  isAuthorized(["ORGANIZER"]),
  participantController.updateParticipantStatus
);

export default router;
