import { Router } from "express";
import * as AuthController from "../controllers/auth.controller";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { isAuthorized } from "../middlewares/isAuthorized";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication & User management
 */

/**
 * @swagger
 * /auth:
 *   get:
 *     summary: Test Auth API
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: API running successfully
 */
router.get("/", (_req, res) => {
  res.send("Auth API Running Successfully");
});

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: User signup
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               fullName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, ORGANIZER, PARTICIPANT]
 *     responses:
 *       201:
 *         description: User created successfully
 */
router.post("/signup", AuthController.signup);

/**
 * @swagger
 * /auth/create-user:
 *   post:
 *     summary: Register a user (Organizer only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - fullName
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               fullName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, ORGANIZER, PARTICIPANT]
 *     responses:
 *       201:
 *         description: User created by organizer
 */
router.post(
  "/create-user",
  isAuthenticated,
  isAuthorized(["ORGANIZER"]),
  AuthController.createUserByOrganizer
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful (sets cookies for access & refresh token)
 */
router.post("/login", AuthController.login);

/**
 * @swagger
 * /auth/refresh:
 *   get:
 *     summary: Refresh access token using refresh token (cookie)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 */
router.get("/refresh", AuthController.refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   get:
 *     summary: User logout (revokes tokens & clears cookies)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post("/logout", isAuthenticated, AuthController.logout);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset link sent to email
 */
router.post("/forgot-password", AuthController.forgotPassword);

/**
 * @swagger
 * /auth/verify-reset:
 *   post:
 *     summary: Verify reset token and update password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post("/verify-reset", AuthController.verifyReset);

export default router;

