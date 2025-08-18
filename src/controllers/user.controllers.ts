import { Request, Response, NextFunction } from "express";
import { prisma } from "../services/prisma";
import ErrorHandler from "../utils/ErrorHandler";
import { updateUserSchema } from "../validators/user.schema";
import { AuthRequest } from "../utils/isAuthenticated";

// get current user information
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user; // from authMiddleware
    if (!userId) throw new ErrorHandler("Unauthorized", 401);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true, role: true },
    });

    if (!user) throw new ErrorHandler("User not found", 404);

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// update user information
export const updateUserInfo = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user;
    if (!userId) throw new ErrorHandler("Unauthorized", 401);

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

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
