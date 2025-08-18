import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { JwtPayload } from "../types/jwt";

export async function issueTokens(userId: string) {
  const accessToken = jwt.sign({ sub: userId }, ENV.ACCESS_SECRET, {
    expiresIn: ENV.ACCESS_EXPIRES,
  });

  const refreshToken = jwt.sign({ sub: userId }, ENV.REFRESH_SECRET, {
    expiresIn: ENV.REFRESH_EXPIRES,
  });

  // compute refresh expiry date
  const decoded = jwt.decode(refreshToken) as { exp: number };
  const refreshExp = new Date(decoded.exp * 1000);

  return { accessToken, refreshToken, refreshExp };
}

export function verifyAccess(token: string): JwtPayload {
  return jwt.verify(token, ENV.ACCESS_SECRET) as JwtPayload;
}

export function verifyRefresh(token: string): JwtPayload {
  return jwt.verify(token, ENV.REFRESH_SECRET) as JwtPayload;
}
