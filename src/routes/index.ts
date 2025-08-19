import { Router } from "express";
import authRoutes from "./auth.routes";
import eventRoutes from "./events.routes";
import userRoutes from "./user.routes"

const router = Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/events", eventRoutes);

export default router;
