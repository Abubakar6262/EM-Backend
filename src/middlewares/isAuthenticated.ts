import { Request, Response, NextFunction } from "express";
import { verifyAccess } from "../utils/jwt";

export interface AuthRequest extends Request {
  user?: string; // user ID attached by auth middleware
}

export function isAuthenticated(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  if (!accessToken) {
    if (refreshToken) {
      return res.status(401).json({ message: "Please update access token" });
    } else {
      return res
        .status(401)
        .json({ message: "Please login first to access this resource" });
    }
  }

  try {
    const payload = verifyAccess(accessToken);
    req.user = payload.sub as string; // attach userId to request
    next();
  } catch (err) {
    if (refreshToken) {
      return res.status(401).json({ message: "Please update access token" });
    }
    return res
      .status(401)
      .json({
        error: err,
        message: "Invalid or expired token. Please login again.",
      });
  }
}
