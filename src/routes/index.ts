import { Router } from "express";
import authRoutes from "./auth.routes";
import eventRoutes from "./events.routes";
import userRoutes from "./user.routes"
import participantRoutes from "./participant.routes"

const router = Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/events", eventRoutes);
router.use("/participant", participantRoutes);

export default router;
