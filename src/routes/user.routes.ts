import { Router } from "express";
import * as UserController from "../controllers/user.controllers";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { upload } from "../utils/uploadToCloudinary";
import { isAuthorized } from "../middlewares/isAuthorized";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management & profile endpoints
 */

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Test User API
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: API running successfully
 */
router.get("/", (_req, res) => {
  res.send("user API Running Successfully");
});

/**
 * @swagger
 * /user/me:
 *   get:
 *     summary: Get current logged-in user info
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details
 */
router.get("/me", isAuthenticated, UserController.getMe);

/**
 * @swagger
 * /user/all:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
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
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of users
 */
router.get(
  "/all",
  isAuthenticated,
  isAuthorized(["ADMIN"]),
  UserController.getAllUsers
);

/**
 * @swagger
 * /user/created-by-me:
 *   get:
 *     summary: Get users created by organizer
 *     tags: [Users]
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
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of users created by organizer
 */
router.get(
  "/created-by-me",
  isAuthenticated,
  isAuthorized(["ORGANIZER"]),
  UserController.getUsersByCreator
);

/**
 * @swagger
 * /user/update-user-role:
 *   put:
 *     summary: Update a user's role (Admin/Organizer)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *               - user
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [ADMIN, ORGANIZER, PARTICIPANT]
 *               user:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *     responses:
 *       200:
 *         description: User role updated successfully
 */
router.put(
  "/update-user-role",
  isAuthenticated,
  isAuthorized(["ADMIN", "ORGANIZER"]),
  UserController.updateUserRole
);

/**
 * @swagger
 * /user/update-user-info:
 *   put:
 *     summary: Update current user information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - phone
 *             properties:
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: User info updated successfully
 */
router.put("/update-user-info", isAuthenticated, UserController.updateUserInfo);

/**
 * @swagger
 * /user/update-profile-pic:
 *   put:
 *     summary: Update user profile picture
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePic:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile picture updated successfully
 */
router.put(
  "/update-profile-pic",
  isAuthenticated,
  upload.single("profilePic"),
  UserController.updateProfilePic
);

/**
 * @swagger
 * /user/update-password:
 *   put:
 *     summary: Update user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 */
router.put("/update-password", isAuthenticated, UserController.updatePassword);

/**
 * @swagger
 * /user/delete-user/{id}:
 *   delete:
 *     summary: Delete a user (Admin/Organizer only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.delete(
  "/delete-user/:id",
  isAuthenticated,
  isAuthorized(["ADMIN", "ORGANIZER"]),
  UserController.deleteUser
);

export default router;
