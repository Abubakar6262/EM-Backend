import { Router } from "express";
import * as UserController from "../controllers/user.controllers";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { upload } from "../utils/uploadToCloudinary";
import { isAuthorized } from "../middlewares/isAuthorized";

const router = Router();


// test user api route
router.get("/", (_req, res) => {
  res.send("user API Running Successfully");
});

// get current user route
router.get("/me", isAuthenticated, UserController.getMe);

// get all users route
router.get(
  "/all",
  isAuthenticated,
  isAuthorized(["ADMIN"]),
  UserController.getAllUsers
);

// update user role
router.put(
  "/update-user-role",
  isAuthenticated,
  isAuthorized(["ADMIN"]),
  UserController.updateUserRole
);

// Update userInfo
router.put("/update-user-info", isAuthenticated, UserController.updateUserInfo);

// Update user profile pic
router.put("/update-profile-pic", isAuthenticated, upload.single("profilePic"), UserController.updateProfilePic);

// update user password
router.put("/update-password", isAuthenticated, UserController.updatePassword);

// delete user
router.delete("/delete-user/:id", isAuthenticated, isAuthorized(["ADMIN"]), UserController.deleteUser);

export default router;
