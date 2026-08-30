import { getDeviceName } from "../utils/deviceInfo.js";
import { generateRefreshToken } from "../utils/jwt.js";
import { Request } from "express";
import { prisma } from "../config/prisma.js";

// services/auth.service.ts
const MAX_DEVICES = 5;

export async function createSession(userId: string, req: Request) {
  const userAgent = req.headers['user-agent'] || '';
  const ip = req.ip;
  const deviceName = getDeviceName(userAgent);

  // count active (non-revoked, non-expired) sessions
  const activeSessions = await prisma.refreshToken.findMany({
    where: {
      userId,
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastUsedAt: 'asc' }, // oldest first
  });

  // if at/over limit, revoke the oldest one(s) to make room
  if (activeSessions.length >= MAX_DEVICES) {
    const excess = activeSessions.length - MAX_DEVICES + 1;
    const toRevoke = activeSessions.slice(0, excess).map(s => s.id);

    await prisma.refreshToken.updateMany({
      where: { id: { in: toRevoke } },
      data: { isRevoked: true },
    });
  }

  const token = generateRefreshToken({ userId }); // your existing token generation
  const session = await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      deviceName,
      ipAddress: ip,
      userAgent,
    },
  });

  return session;
}