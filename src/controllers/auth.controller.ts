import { Request, Response, NextFunction } from "express";
import { prisma } from "../services/prisma";
import bcrypt from "bcryptjs";
import ErrorHandler from "../utils/ErrorHandler";
import { issueTokens, verifyRefresh } from "../utils/jwt";
import { loginSchema, signupSchema } from "../validators/auth.schema";
import { AuthRequest } from "../utils/isAuthenticated";
// import { string } from "zod";

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = signupSchema.parse(req.body); // Zod validates input
    const { email, password, fullName } = parsed;
   
    if (!email || !password || !fullName) {
      throw new ErrorHandler("email, password, and fullName are required", 400);
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new ErrorHandler("Email already in use", 400);

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { email, passwordHash, fullName },
    });

    // const { accessToken, refreshToken, refreshExp } = await issueTokens(
    //   user.id
    // );

    // await prisma.refreshToken.create({
    //   data: { userId: user.id, token: refreshToken, expiresAt: refreshExp },
    // });

    // res.status(201).json({
    //   success: true,
    //   user: {
    //     id: user.id,
    //     email: user.email,
    //     fullName: user.fullName,
    //     role: user.role,
    //   },
    //   accessToken,
    //   refreshToken,
    // });
    res.status(201).json({
      success: true,
      message: "Account created. Please log in.",
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = loginSchema.parse(req.body); // Zod validates input
    const { email, password } = parsed;
    if (!email || !password)
      throw new ErrorHandler("email and password required", 400);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash)
      throw new ErrorHandler("Invalid credentials", 401);

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new ErrorHandler("Invalid credentials", 401);

    const { accessToken, refreshToken, refreshExp } = await issueTokens(
      user.id
    );
    await prisma.refreshToken.create({
      data: { userId: user.id, token: refreshToken, expiresAt: refreshExp },
    });
    // res.json({
    //   success: true,
    //   user: {
    //     id: user.id,
    //     email: user.email,
    //     fullName: user.fullName,
    //     role: user.role,
    //   },
    //   accessToken,
    //   refreshToken,
    // });
    res
      .cookie("accessToken", accessToken, {
        httpOnly: true, // JS can't read it → protects from XSS
        secure: true, // send only over HTTPS
        sameSite: "strict", // CSRF protection
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
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      });
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const oldRefreshToken = req.cookies.refreshToken;
    if (!oldRefreshToken)
      throw new ErrorHandler("No refresh token provided", 401);

    // verify refresh token signature & expiry
    const payload = verifyRefresh(oldRefreshToken);

    // check token exists in DB and is not revoked
    const stored = await prisma.refreshToken.findUnique({
      where: { token: oldRefreshToken },
    });
    if (!stored || stored.revokedAt !== null) {
      throw new ErrorHandler("Refresh token invalid", 401);
    }

    // revoke old refresh token
    await prisma.refreshToken.update({
      where: { token: oldRefreshToken },
      data: { revokedAt: new Date() },
    });

    // issue new tokens
    const {
      accessToken,
      refreshToken: newRefresh,
      refreshExp,
    } = await issueTokens(payload.sub);

    await prisma.refreshToken.create({
      data: { userId: payload.sub, token: newRefresh, expiresAt: refreshExp },
    });

    // set new cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 1000 * 60 * 5, // 5m or match ENV.ACCESS_EXPIRES
    });
    res.cookie("refreshToken", newRefresh, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7d or match ENV.REFRESH_EXPIRES
    });

    res.json({ success: true, message: "Token refreshed" });
  } catch (err) {
    next(err);
  }
};

export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // console.log("request user ", (req as any).user);
    const userId = req.user; // from authMiddleware isAuthenticated
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // revoke all active refresh tokens for this user
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    // clear cookies
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

    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};
