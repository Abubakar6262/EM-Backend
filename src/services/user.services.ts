// services/UserService.ts
import {prisma} from "../services/prisma";
import { deleteImageFromCloudinary } from "../utils/deleteImageFromCloudinary";
import ErrorHandler from "../utils/ErrorHandler";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

// Get all users
export const getAllUsersService = async (
  page: number,
  limit: number,
  search?: string
) => {
  const skip = (page - 1) * limit;

  const whereCondition = search
    ? {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [users, totalUsers] = await Promise.all([
    prisma.user.findMany({
      where: whereCondition,
      select: { id: true, email: true, fullName: true, role: true },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where: whereCondition }),
  ]);

  const totalPages = Math.ceil(totalUsers / limit);

  return {
    users,
    totalUsers,
    totalPages,
    currentPage: page,
  };
};

//  Get current user info
export const getMeService = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, fullName: true, role: true },
  });

  if (!user) {
    throw new ErrorHandler("User not found", 404);
  }

  return user;
};

// Update user information
export const updateUserInfoService = async (
  userId: string,
  fullName: string,
  phone: string
) => {
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

  return user;
};

// update profile pic
export const updateProfilePicService = async (
  userId: string,
  newImageUrl: string
) => {
  // Get old profile picture before updating
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { profilePic: true },
  });

  if (!user) {
    throw new ErrorHandler("User not found", 404);
  }

  // Update with new profile picture
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { profilePic: newImageUrl },
    select: { id: true, email: true, fullName: true, profilePic: true },
  });

  // Delete old profile picture if exists
  if (user.profilePic) {
    await deleteImageFromCloudinary(user.profilePic);
  }

  return updatedUser;
};

// update role

export const updateUserRoleService = async (userId: string, role: string) => {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role: role as UserRole },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
    },
  });

  if (!updatedUser) {
    throw new ErrorHandler("User not found", 404);
  }

  return updatedUser;
};

// Update user password
export const updatePasswordService = async (
  userId: string,
  oldPassword: string,
  newPassword: string
) => {
  // Get user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new ErrorHandler("User not found", 404);
  if (!user.passwordHash)
    throw new ErrorHandler("User has no password set", 400);

  // Compare old password
  const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isMatch) throw new ErrorHandler("Old password is incorrect", 400);

  // Hash and update new password
  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });

  return true; // just success flag
};

//  Delete user service
export const deleteUserService = async (userId: string) => {
  const user = await prisma.user.delete({
    where: { id: userId },
  });
  return user;
};