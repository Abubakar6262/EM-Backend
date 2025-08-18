import { Router } from "express";
import * as AuthController from "../controllers/auth.controller";
import { isAuthenticated } from "../utils/isAuthenticated";

const router = Router();

// test auth api route
router.get("/", (_req, res) => {
  res.send("Auth API Running Successfully");
});

//user signup route 
router.post("/signup", AuthController.signup);

// user login route
router.post("/login", AuthController.login);

// token refresh route
router.get("/refresh", AuthController.refreshToken);

// user logout route
router.get("/logout", isAuthenticated,AuthController.logout);


export default router;
