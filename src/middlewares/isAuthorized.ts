import { NextFunction, Response } from "express";
import { AuthRequest } from "./isAuthenticated";
import ErrorHandler from "../utils/ErrorHandler";
import { prisma } from "../services/prisma";

export const isAuthorized = (roles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ErrorHandler("Unauthorized", 401);
      }

      // req.user is userId
      const user = await prisma.user.findUnique({
        where: { id: req.user },
        select: { role: true },
      });

      if (!user) {
        throw new ErrorHandler("User not found", 404);
      }

      if (!roles.includes(user.role)) {
        throw new ErrorHandler("Not authorized to access this resource", 403);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
