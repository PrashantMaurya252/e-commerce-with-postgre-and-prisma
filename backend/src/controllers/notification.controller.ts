import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { AuthRequest } from "../middlewares/auth.js";

// Fetch user notifications
export const getUserNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        receiverId: userId,
        isDeleted: false,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error("getUserNotifications error", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Mark a specific notification as read
export const markNotificationAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    if (notification.receiverId !== userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });

    return res.status(200).json({ success: true, message: "Notification marked as read", data: updated });
  } catch (error) {
    console.error("markNotificationAsRead error", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Mark all as read
export const markAllNotificationsAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await prisma.notification.updateMany({
      where: { receiverId: userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("markAllNotificationsAsRead error", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
