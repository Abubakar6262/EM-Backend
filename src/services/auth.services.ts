import {prisma} from "../services/prisma";
import ErrorHandler from "../utils/ErrorHandler";
import bcrypt from "bcryptjs";
import { issueTokens, verifyRefresh, verifyResetToken } from "../utils/jwt";
import { UserRole } from "@prisma/client";

interface SignupInput {
  email: string;
  password: string;
  fullName: string;
  role?: UserRole;
}
interface LoginInput {
  email: string;
  password: string;
}

export const signupService = async ({
  email,
  password,
  fullName,
  role,
}: SignupInput) => {
  // Check if user already exists
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    throw new ErrorHandler("Email already in use", 400);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: { email, passwordHash, fullName, role: role ?? "PARTICIPANT" },
  });

  return user;
};

export const loginService = async ({ email, password }: LoginInput) => {
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

  // Save refresh token in DB
  await prisma.refreshToken.create({
    data: { userId: user.id, token: refreshToken, expiresAt: refreshExp },
  });

  return {
    accessToken,
    refreshToken,
    refreshExp,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  };
};

export const refreshTokenService = async (oldRefreshToken: string) => {
  if (!oldRefreshToken) {
    throw new ErrorHandler("No refresh token provided", 401);
  }

  // Verify refresh token
  const payload = verifyRefresh(oldRefreshToken);

  // Check DB
  const stored = await prisma.refreshToken.findUnique({
    where: { token: oldRefreshToken },
  });

  if (!stored || stored.revokedAt !== null) {
    throw new ErrorHandler("Refresh token invalid", 401);
  }

  // Revoke old token
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

  return { accessToken, refreshToken: newRefresh };
};

export const logoutService = async (userId: string) => {
  if (!userId) {
    throw new ErrorHandler("Unauthorized", 401);
  }

  // Revoke all active refresh tokens for this user
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  return true;
};

export const verifyResetService = async (
  token: string,
  newPassword: string
) => {
  if (!token) {
    throw new ErrorHandler("Reset token is required", 400);
  }

  if (!newPassword || newPassword.length < 6) {
    throw new ErrorHandler("Password must be at least 6 characters", 400);
  }

  // Verify token signature (JWT)
  let payload;
  try {
    payload = verifyResetToken(token);
  } catch {
    throw new ErrorHandler("Invalid or expired token", 400);
  }

  // Find token record in DB
  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      userId: payload.sub,
      code: token,
      expiresAt: { gte: new Date() },
    },
  });

  if (!otpRecord) {
    throw new ErrorHandler("Token is invalid or has expired", 400);
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update user password
  await prisma.user.update({
    where: { id: payload.sub },
    data: { passwordHash: hashedPassword },
  });

  // Delete used token (cannot be reused)
  await prisma.otpCode.delete({ where: { id: otpRecord.id } });

  return true;
};