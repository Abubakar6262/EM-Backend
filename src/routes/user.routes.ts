import { Router } from "express";
import * as UserController from "../controllers/user.controllers";
import { isAuthenticated } from "../utils/isAuthenticated";

const router = Router();

// test user api route
router.get("/", (_req, res) => {
  res.send("user API Running Successfully");
});

// get current user route
router.get("/me", isAuthenticated, UserController.getMe);

// Update userInfo
router.put("/update-user-info", isAuthenticated, UserController.updateUserInfo);

export default router;
