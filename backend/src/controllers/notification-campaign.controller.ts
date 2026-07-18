import { Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AuthRequest } from "../middlewares/auth.js";
import { NotificationChannel, NotificationStatus } from "@prisma/client";

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const createCampaignSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  channel: z.nativeEnum(NotificationChannel),
  // If provided → scheduled; if omitted → send instantly
  scheduledAt: z
    .string()
    .datetime({ message: "scheduledAt must be a valid ISO datetime string" })
    .optional(),
  // Notification payload
  notificationTitle: z.string().min(1, "Notification title is required"),
  notificationDescription: z
    .string()
    .min(1, "Notification description is required"),
  actionUrl: z.string().url().optional(),
  // Target: leave empty to send to ALL users
  receiverIds: z.array(z.string().uuid()).optional(),
});

const updateCampaignSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().min(1),
    channel: z.nativeEnum(NotificationChannel),
    scheduledAt: z
      .string()
      .datetime({ message: "scheduledAt must be a valid ISO datetime string" })
      .optional(),
    notificationTitle: z.string().min(1),
    notificationDescription: z.string().min(1),
    actionUrl: z.string().url().optional(),
    receiverIds: z.array(z.string().uuid()).optional(),
  })
  .partial();

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns true if the campaign has at least one notification already sent */
const hasSentNotifications = async (campaignId: string): Promise<boolean> => {
  const count = await prisma.notification.count({
    where: {
      campaignId,
      status: { in: [NotificationStatus.SENT] },
    },
  });
  return count > 0;
};

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /api/v1/notification-campaign/create
 * Admin creates a campaign. If scheduledAt is provided it must be in the future.
 * If scheduledAt is omitted notifications are dispatched immediately.
 */
export const createCampaign = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const parsed = createCampaignSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    const {
      title,
      description,
      channel,
      scheduledAt,
      notificationTitle,
      notificationDescription,
      actionUrl,
      receiverIds,
    } = parsed.data;

    const isScheduled = !!scheduledAt;

    // Validate future time for scheduled campaigns
    if (isScheduled) {
      const scheduleTime = new Date(scheduledAt!);
      if (scheduleTime <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "scheduledAt must be a future date and time",
        });
      }
    }

    // Resolve target users
    let targetUserIds: string[] = [];
    if (receiverIds && receiverIds.length > 0) {
      // Validate that all provided IDs exist
      const users = await prisma.user.findMany({
        where: { id: { in: receiverIds }, isActive: true, isDeleted: false },
        select: { id: true },
      });
      targetUserIds = users.map((u) => u.id);
      if (targetUserIds.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No active users found for provided receiverIds",
        });
      }
    } else {
      // Target ALL active users
      const allUsers = await prisma.user.findMany({
        where: { isActive: true, isDeleted: false },
        select: { id: true },
      });
      targetUserIds = allUsers.map((u) => u.id);
    }

    // Create campaign + notifications in a transaction
    const campaign = await prisma.$transaction(async (tx) => {
      const createdCampaign = await tx.notificationCampaign.create({
        data: {
          title,
          description,
          channel,
          scheduledAt: isScheduled ? new Date(scheduledAt!) : null,
          createdBy: adminId,
        },
      });

      const notificationsData = targetUserIds.map((userId) => ({
        title: notificationTitle,
        description: notificationDescription,
        actionUrl: actionUrl ?? null,
        senderId: adminId,
        receiverId: userId,
        campaignId: createdCampaign.id,
        channel,
        status: isScheduled ? NotificationStatus.PENDING : NotificationStatus.SENT,
        scheduledAt: isScheduled ? new Date(scheduledAt!) : null,
        sentAt: isScheduled ? null : new Date(),
      }));

      await tx.notification.createMany({ data: notificationsData });

      return createdCampaign;
    });

    return res.status(201).json({
      success: true,
      message: isScheduled
        ? `Campaign scheduled for ${scheduledAt}`
        : "Campaign created and notifications sent instantly",
      data: campaign,
    });
  } catch (error) {
    console.error("createCampaign error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * PUT /api/v1/notification-campaign/:campaignId
 * Admin updates a campaign — only allowed if NO notifications have been sent yet.
 * Also validates future scheduledAt if being changed.
 */
export const updateCampaign = async (req: AuthRequest, res: Response) => {
  try {
    const { campaignId } = req.params;

    const campaign = await prisma.notificationCampaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) {
      return res
        .status(404)
        .json({ success: false, message: "Campaign not found" });
    }

    // Only scheduled (future) campaigns can be edited
    if (!campaign.scheduledAt) {
      return res.status(400).json({
        success: false,
        message:
          "Only scheduled campaigns can be updated. Instant campaigns are immutable.",
      });
    }

    // Prevent editing already-sent campaigns
    if (await hasSentNotifications(campaignId)) {
      return res.status(400).json({
        success: false,
        message: "Cannot update a campaign that has already been sent",
      });
    }

    const parsed = updateCampaignSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    const {
      title,
      description,
      channel,
      scheduledAt,
      notificationTitle,
      notificationDescription,
      actionUrl,
      receiverIds,
    } = parsed.data;

    // Validate new scheduledAt is in the future
    if (scheduledAt) {
      const scheduleTime = new Date(scheduledAt);
      if (scheduleTime <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "scheduledAt must be a future date and time",
        });
      }
    }

    const updatedCampaign = await prisma.$transaction(async (tx) => {
      const updated = await tx.notificationCampaign.update({
        where: { id: campaignId },
        data: {
          ...(title && { title }),
          ...(description && { description }),
          ...(channel && { channel }),
          ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
        },
      });

      // If notification content or target changed, recreate pending notifications
      const hasContentChange =
        notificationTitle || notificationDescription || actionUrl !== undefined || receiverIds;

      if (hasContentChange) {
        // Delete existing pending notifications for this campaign
        await tx.notification.deleteMany({
          where: { campaignId, status: NotificationStatus.PENDING },
        });

        let targetUserIds: string[] = [];
        if (receiverIds && receiverIds.length > 0) {
          const users = await tx.user.findMany({
            where: { id: { in: receiverIds }, isActive: true, isDeleted: false },
            select: { id: true },
          });
          targetUserIds = users.map((u) => u.id);
        } else {
          const allUsers = await tx.user.findMany({
            where: { isActive: true, isDeleted: false },
            select: { id: true },
          });
          targetUserIds = allUsers.map((u) => u.id);
        }

        const resolvedChannel = channel ?? updated.channel;
        const resolvedScheduledAt = scheduledAt
          ? new Date(scheduledAt)
          : updated.scheduledAt;

        const notificationsData = targetUserIds.map((userId) => ({
          title: notificationTitle ?? "",
          description: notificationDescription ?? "",
          actionUrl: actionUrl ?? null,
          receiverId: userId,
          campaignId,
          channel: resolvedChannel,
          status: NotificationStatus.PENDING,
          scheduledAt: resolvedScheduledAt,
          sentAt: null,
        }));

        await tx.notification.createMany({ data: notificationsData });
      } else if (scheduledAt) {
        // Just update the scheduledAt on existing pending notifications
        await tx.notification.updateMany({
          where: { campaignId, status: NotificationStatus.PENDING },
          data: { scheduledAt: new Date(scheduledAt) },
        });
      }

      return updated;
    });

    return res.status(200).json({
      success: true,
      message: "Campaign updated successfully",
      data: updatedCampaign,
    });
  } catch (error) {
    console.error("updateCampaign error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * DELETE /api/v1/notification-campaign/:campaignId
 * Admin can only delete scheduled campaigns that haven't been sent yet.
 */
export const deleteCampaign = async (req: AuthRequest, res: Response) => {
  try {
    const { campaignId } = req.params;

    const campaign = await prisma.notificationCampaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) {
      return res
        .status(404)
        .json({ success: false, message: "Campaign not found" });
    }

    // Only scheduled campaigns can be deleted
    if (!campaign.scheduledAt) {
      return res.status(400).json({
        success: false,
        message:
          "Only scheduled campaigns can be deleted. Instant campaigns cannot be removed.",
      });
    }

    // Prevent deleting already-sent campaigns
    if (await hasSentNotifications(campaignId)) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a campaign that has already been sent",
      });
    }

    // Delete notifications then campaign
    await prisma.$transaction(async (tx) => {
      await tx.notification.deleteMany({ where: { campaignId } });
      await tx.notificationCampaign.delete({ where: { id: campaignId } });
    });

    return res.status(200).json({
      success: true,
      message: "Campaign and its notifications deleted successfully",
    });
  } catch (error) {
    console.error("deleteCampaign error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * GET /api/v1/notification-campaign
 * Admin fetches all campaigns with pagination.
 * Query: page, limit, type=instant|scheduled
 */
export const getAllCampaigns = async (req: AuthRequest, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const type = req.query.type as "instant" | "scheduled" | undefined;
    const skip = (page - 1) * limit;

    let where: any = {};
    if (type === "instant") where.scheduledAt = null;
    if (type === "scheduled") where.scheduledAt = { not: null };

    const [campaigns, total] = await Promise.all([
      prisma.notificationCampaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { notifications: true } },
        },
      }),
      prisma.notificationCampaign.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Campaigns fetched successfully",
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: campaigns,
    });
  } catch (error) {
    console.error("getAllCampaigns error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * GET /api/v1/notification-campaign/:campaignId
 * Admin fetches details of a single campaign with its notifications.
 */
export const getCampaignById = async (req: AuthRequest, res: Response) => {
  try {
    const { campaignId } = req.params;

    const campaign = await prisma.notificationCampaign.findUnique({
      where: { id: campaignId },
      include: {
        notifications: {
          take: 50,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            receiverId: true,
            sentAt: true,
            scheduledAt: true,
            isRead: true,
          },
        },
        _count: { select: { notifications: true } },
      },
    });

    if (!campaign) {
      return res
        .status(404)
        .json({ success: false, message: "Campaign not found" });
    }

    return res.status(200).json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    console.error("getCampaignById error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
