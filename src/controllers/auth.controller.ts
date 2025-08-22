import { Request, Response } from "express";
import { prisma } from "../services/prisma";
import bcrypt from "bcryptjs";
import ErrorHandler from "../utils/ErrorHandler";
import {
  issueResetToken,
  issueTokens,
  verifyRefresh,
  verifyResetToken,
} from "../utils/jwt";
import {
  loginSchema,
  signupSchema,
  updatePasswordSchema,
} from "../validators/auth.schema";
import { AuthRequest } from "../middlewares/isAuthenticated";
import { sendEmail } from "../utils/sendMail";
import { ENV } from "../config/env";
import catchAsync from "../middlewares/catchAsync";
// import { string } from "zod";

export const signup = catchAsync(async (req: Request, res: Response) => {
  // Validate input using Zod
  const parsed = signupSchema.parse(req.body);
  const { email, password, fullName } = parsed;

  if (!email || !password || !fullName) {
    throw new ErrorHandler("Email, password, and full name are required", 400);
  }

  // Check if user already exists
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    throw new ErrorHandler("Email already in use", 400);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  await prisma.user.create({
    data: { email, passwordHash, fullName },
  });

  // For now, return simple success (login separately)
  // Or you could issue tokens directly here if you want auto-login after signup

  res.status(201).json({
    success: true,
    message: "Account created. Please log in.",
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  // Validate request body with Zod
  const parsed = loginSchema.parse(req.body);
  const { email, password } = parsed;

  if (!email || !password) {
    throw new ErrorHandler("Email and password are required", 400);
  }

  // Find user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    throw new ErrorHandler("Invalid credentials", 401);
  }

  // Verify password
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new ErrorHandler("Invalid credentials", 401);
  }

  // Issue tokens
  const { accessToken, refreshToken, refreshExp } = await issueTokens(user.id);

  await prisma.refreshToken.create({
    data: { userId: user.id, token: refreshToken, expiresAt: refreshExp },
  });

  // Set cookies + send response
  res
    .cookie("accessToken", accessToken, {
      httpOnly: true, // prevents JS access (XSS protection)
      secure: true, // HTTPS only
      sameSite: "strict", // CSRF protection
      maxAge: 15 * 60 * 1000, // 15 minutes
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })
    .json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
});

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const oldRefreshToken = req.cookies.refreshToken;

  if (!oldRefreshToken) {
    throw new ErrorHandler("No refresh token provided", 401);
  }

  // Verify refresh token signature & expiry
  const payload = verifyRefresh(oldRefreshToken);

  // Check token exists in DB and is not revoked
  const stored = await prisma.refreshToken.findUnique({
    where: { token: oldRefreshToken },
  });

  if (!stored || stored.revokedAt !== null) {
    throw new ErrorHandler("Refresh token invalid", 401);
  }

  // Revoke old refresh token
  await prisma.refreshToken.update({
    where: { token: oldRefreshToken },
    data: { revokedAt: new Date() },
  });

  // Issue new tokens
  const {
    accessToken,
    refreshToken: newRefresh,
    refreshExp,
  } = await issueTokens(payload.sub);

  await prisma.refreshToken.create({
    data: {
      userId: payload.sub,
      token: newRefresh,
      expiresAt: refreshExp,
    },
  });

  // Set new cookies
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 1000 * 60 * 5, // 5m
  });
  res.cookie("refreshToken", newRefresh, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7d
  });

  res.json({
    success: true,
    message: "Token refreshed",
  });
});

export const logout = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user; // from authMiddleware isAuthenticated

  if (!userId) {
    throw new ErrorHandler("Unauthorized", 401);
  }

  // Revoke all active refresh tokens for this user
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  // Clear cookies
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });

  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

export const forgotPassword = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      throw new ErrorHandler("Email is required", 400);
    }

    // Find the user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new ErrorHandler("User not found", 404);
    }

    // Generate a secure random token
    const token = issueResetToken(user.id);

    // Set expiry time: 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Store token (consider hashing if sensitive)
    await prisma.otpCode.create({
      data: {
        userId: user.id,
        code: token,
        expiresAt,
      },
    });

    // Create reset link
    const resetLink = `${ENV.FRONTEND_URL}/reset-password?token=${token}`;

    // Send email with the link
    await sendEmail({
      to: user.email,
      subject: "Password Reset Link",
      text: `You requested a password reset. Click the link below to reset your password. The link expires in 10 minutes:\n\n${resetLink}`,
    });

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email.",
    });
  }
);

export const verifyReset = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.query;
  const parsed = updatePasswordSchema.parse(req.body);
  const { newPassword } = parsed;
  const password = newPassword;

  // Validate token
  if (!token || typeof token !== "string") {
    throw new ErrorHandler("Reset token is required", 400);
  }

  // Validate password
  if (!password || password.length < 6) {
    throw new ErrorHandler("Password must be at least 6 characters", 400);
  }

  // Verify token signature (JWT)
  let payload;
  try {
    payload = verifyResetToken(token);
  } catch (err) {
    console.log("JWT verification error:", err);
    throw new ErrorHandler("Invalid or expired token", 400);
  }

  // Find token in database and check expiry
  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      userId: payload.sub,
      code: token,
      expiresAt: { gte: new Date() }, // not expired
    },
  });

  if (!otpRecord) {
    throw new ErrorHandler("Token is invalid or has expired", 400);
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Update user password
  await prisma.user.update({
    where: { id: payload.sub },
    data: { passwordHash: hashedPassword },
  });

  // Delete the token from database (cannot be reused)
  await prisma.otpCode.delete({ where: { id: otpRecord.id } });

  res.status(200).json({
    success: true,
    message: "Password successfully reset. You can now login.",
  });
});
