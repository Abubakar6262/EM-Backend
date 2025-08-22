import { Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { updateUserSchema } from "../validators/user.schema";
import { AuthRequest } from "../middlewares/isAuthenticated";
import catchAsync from "../middlewares/catchAsync";
import { updatePasswordSchema } from "../validators/auth.schema";
import {
  deleteUserService,
  getAllUsersService,
  getMeService,
  updatePasswordService,
  updateProfilePicService,
  updateUserInfoService,
  updateUserRoleService,
} from "../services/user.services";

// get current user information
export const getMe = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user; // from authMiddleware

  if (!userId) {
    throw new ErrorHandler("Unauthorized", 401);
  }

  const user = await getMeService(userId);

  res.status(200).json({
    success: true,
    user,
  });
});

// get all users
export const getAllUsers = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { page = "1", limit = "10", search } = req.query;
    const userId = req.user;
    if (!userId) {
      throw new ErrorHandler("Unauthorized", 401);
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;

    const result = await getAllUsersService(
      pageNum,
      limitNum,
      search as string
    );

    res.json({
      success: true,
      ...result, // includes users, totalUsers, totalPages, currentPage
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

    const user = await updateUserInfoService(userId, fullName, phone as string);

    res.status(200).json({
      success: true,
      user,
    });
  }
);

// update user profile pic
export const updateProfilePic = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user;
    if (!userId) throw new ErrorHandler("Unauthorized", 401);

    if (!req.file) throw new ErrorHandler("No file uploaded", 400);

    const newImageUrl = req.file.path;

    const updatedUser = await updateProfilePicService(userId, newImageUrl);

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

    const updatedUser = await updateUserRoleService(user.id, role);

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
    if (!userId) throw new ErrorHandler("Unauthorized", 401);

    // Validate input
    const parsed = updatePasswordSchema.parse(req.body);
    const { newPassword } = parsed;
    const { oldPassword } = req.body;

    await updatePasswordService(userId, oldPassword, newPassword);

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  }
);

// Delete user controller
export const deleteUser = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const userId = req.params.id;

    const checkRequest = req.user;

    if (!checkRequest) {
      throw new ErrorHandler("Unauthorized", 401);
    }
    
    if (!userId) {
      throw new ErrorHandler("User ID is required", 400);
    }

    await deleteUserService(userId);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  }
);
