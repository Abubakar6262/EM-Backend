import { Response } from "express";
import { prisma } from "../services/prisma";
import ErrorHandler from "../utils/ErrorHandler";
import { updateUserSchema } from "../validators/user.schema";
import { AuthRequest } from "../middlewares/isAuthenticated";
import catchAsync from "../middlewares/catchAsync";
import bcrypt from "bcryptjs";
import { updatePasswordSchema } from "../validators/auth.schema";

// get current user information
export const getMe = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user; // from authMiddleware

  if (!userId) {
    throw new ErrorHandler("Unauthorized", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, fullName: true, role: true },
  });

  if (!user) {
    throw new ErrorHandler("User not found", 404);
  }

  res.json({
    success: true,
    user,
  });
});

// get all users
export const getAllUsers = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, fullName: true, role: true },
    });

    res.json({
      success: true,
      users,
    });
  }
);

// update user information
export const updateUserInfo = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user;
    if (!userId) {
      throw new ErrorHandler("Unauthorized", 401);
    }

    // Validate input with Zod
    const { fullName, phone } = updateUserSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { fullName, phone },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
      },
    });

    if (!user) {
      throw new ErrorHandler("User not found", 404);
    }

    res.json({ success: true, user });
  }
);

// update user profile pic
export const updateProfilePic = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user;
    if (!userId) throw new ErrorHandler("Unauthorized", 401);

    if (!req.file) throw new ErrorHandler("No file uploaded", 400);

    const imageUrl = req.file.path;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profilePic: imageUrl },
      select: { id: true, email: true, fullName: true, profilePic: true },
    });

    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      profilePic: updatedUser.profilePic,
    });
  }
);

// update user role
export const updateUserRole = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { role, user } = req.body;

    if (!role || !user) {
      throw new ErrorHandler("Role and User are required in body", 400);
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });

    if (!updatedUser) throw new ErrorHandler("User not found", 404);

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user: updatedUser,
    });
  }
);

// update user password
export const updatePassword = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user;

    // Validate request body with Zod
    const parsed = updatePasswordSchema.parse(req.body);
    const { newPassword } = parsed;
    const { oldPassword } = req.body;

    if (!userId) {
      throw new ErrorHandler("Unauthorized", 401);
    }

    // Get user from DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ErrorHandler("User not found", 404);
    }

    if (!user.passwordHash) {
      throw new ErrorHandler("User has no password set", 400);
    }

    // Compare old password
    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new ErrorHandler("Old password is incorrect", 400);
    }

    // Hash and update new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  }
);
