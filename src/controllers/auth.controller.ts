import { Request, Response } from "express";
import { prisma } from "../services/prisma";
import ErrorHandler from "../utils/ErrorHandler";
import {
  loginSchema,
  signupSchema,
  updatePasswordSchema,
} from "../validators/auth.schema";
import { AuthRequest } from "../middlewares/isAuthenticated";
import { sendEmail } from "../utils/sendMail";
import { ENV } from "../config/env";
import catchAsync from "../middlewares/catchAsync";
import {
  loginService,
  logoutService,
  refreshTokenService,
  signupService,
  verifyResetService,
} from "../services/auth.services";
import { issueResetToken } from "../utils/jwt";
// import { string } from "zod";

export const signup = catchAsync(async (req: Request, res: Response) => {
  // Validate input
  const parsed = signupSchema.parse(req.body);
  const { email, password, fullName, role } = parsed;

  if (!email || !password || !fullName) {
    throw new ErrorHandler("Email, password, and full name are required", 400);
  }

  // Call service
  await signupService({ email, password, fullName, role });

  res.status(201).json({
    success: true,
    message: "Account created. Please log in.",
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  // Validate input
  const parsed = loginSchema.parse(req.body);
  const { email, password } = parsed;

  if (!email || !password) {
    throw new ErrorHandler("Email and password are required", 400);
  }

  // Call service
  const { accessToken, refreshToken, user } = await loginService({
    email,
    password,
  });

  // Set cookies
  res
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 min
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })
    .json({
      success: true,
      user,
    });
});

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const oldRefreshToken = req.cookies.refreshToken;

  const { accessToken, refreshToken: newRefresh } = await refreshTokenService(
    oldRefreshToken
  );

  // Set new cookies
  res
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 1000 * 60 * 5, // 5m
    })
    .cookie("refreshToken", newRefresh, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7d
    })
    .json({
      success: true,
      message: "Token refreshed",
    });
});

export const logout = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user; // from auth middleware

  if (!userId) {
    throw new ErrorHandler("Unauthorized", 401);
  }

  await logoutService(userId);

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

  if (!token || typeof token !== "string") {
    throw new ErrorHandler("Reset token is required", 400);
  }

  await verifyResetService(token, newPassword);

  res.status(200).json({
    success: true,
    message: "Password successfully reset. You can now login.",
  });
});
