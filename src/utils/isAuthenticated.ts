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
  const token = req.cookies.accessToken;
  if (!token)
    return res
      .status(401)
      .json({ message: "Please login first to access this resource" });

  try {
    const payload = verifyAccess(token);

    // console.log("payload ", payload)
    req.user = payload.sub as string; // attach userId to request
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ error: err, message: "Invalid or expired token" });
  }
}
