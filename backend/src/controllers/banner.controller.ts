import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AuthRequest } from "../middlewares/auth.js";
import { BannerActionType, BannerPosition, FileType, FilePurpose } from "@prisma/client";
import { uploadToCloudinary } from "../utils/helper.js";

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const createBannerSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  actionType: z.nativeEnum(BannerActionType).default(BannerActionType.NONE),
  actionUrl: z.string().url().optional().or(z.literal("")),
  productId: z.string().uuid().optional().or(z.literal("")),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  position: z.nativeEnum(BannerPosition).default(BannerPosition.HOME_TOP),
  priority: z
    .string()
    .transform((v) => Number(v))
    .optional(),
  isActive: z
    .union([z.boolean(), z.string().transform((v) => v === "true")])
    .optional(),
  startsAt: z
    .string()
    .datetime()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  endsAt: z
    .string()
    .datetime()
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

const updateBannerSchema = createBannerSchema.partial();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uploadBannerImage = async (file: Express.Multer.File) => {
  const result = await uploadToCloudinary(file as any);
  return {
    url: result.secure_url,
    publicId: result.public_id,
    type: FileType.IMAGE,
    filePurpose: FilePurpose.OTHER,
  };
};

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /api/v1/banner
 * Admin creates a banner. Requires `image` file (desktop).
 * Optionally accepts `mobileImage` file.
 */
export const createBanner = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const parsed = createBannerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const desktopFile = files?.image?.[0];
    const mobileFile = files?.mobileImage?.[0];

    if (!desktopFile) {
      return res.status(400).json({
        success: false,
        message: "Desktop banner image is required",
      });
    }

    const {
      title,
      subtitle,
      actionType,
      actionUrl,
      productId,
      categoryId,
      position,
      priority,
      isActive,
      startsAt,
      endsAt,
    } = parsed.data;

    // Upload images to cloudinary
    const desktopImageData = await uploadBannerImage(desktopFile);
    const mobileImageData = mobileFile
      ? await uploadBannerImage(mobileFile)
      : null;

    const banner = await prisma.$transaction(async (tx) => {
      // Create desktop File record
      const desktopFileRecord = await tx.file.create({
        data: desktopImageData,
      });

      // Create mobile File record if present
      let mobileFileRecord = null;
      if (mobileImageData) {
        mobileFileRecord = await tx.file.create({ data: mobileImageData });
      }

      // Create Banner
      return tx.banner.create({
        data: {
          title,
          subtitle: subtitle || null,
          imageId: desktopFileRecord.id,
          mobileImageId: mobileFileRecord?.id || null,
          actionType: actionType ?? BannerActionType.NONE,
          actionUrl: actionUrl || null,
          productId: productId || null,
          categoryId: categoryId || null,
          position: position ?? BannerPosition.HOME_TOP,
          priority: priority ?? 0,
          isActive: isActive ?? true,
          startsAt: startsAt ? new Date(startsAt) : null,
          endsAt: endsAt ? new Date(endsAt) : null,
          createdById: adminId,
        },
        include: {
          image: true,
          mobileImage: true,
          product: { select: { id: true, title: true } },
          category: { select: { id: true, name: true } },
        },
      });
    }, { maxWait: 5000, timeout: 15000 });

    return res.status(201).json({
      success: true,
      message: "Banner created successfully",
      data: banner,
    });
  } catch (error) {
    console.error("createBanner error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * PUT /api/v1/banner/:bannerId
 * Admin updates a banner. Images are optional — omit to keep existing.
 */
export const updateBanner = async (req: AuthRequest, res: Response) => {
  try {
    const { bannerId } = req.params;

    const banner = await prisma.banner.findUnique({
      where: { id: bannerId, isDeleted: false },
    });
    if (!banner) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }

    const parsed = updateBannerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const desktopFile = files?.image?.[0];
    const mobileFile = files?.mobileImage?.[0];

    const updatedBanner = await prisma.$transaction(async (tx) => {
      let newDesktopImageId = banner.imageId;
      let newMobileImageId = banner.mobileImageId;

      // Replace desktop image if new one uploaded
      if (desktopFile) {
        const desktopImageData = await uploadBannerImage(desktopFile);
        const newFile = await tx.file.create({ data: desktopImageData });
        newDesktopImageId = newFile.id;
      }

      // Replace mobile image if new one uploaded
      if (mobileFile) {
        const mobileImageData = await uploadBannerImage(mobileFile);
        const newFile = await tx.file.create({ data: mobileImageData });
        newMobileImageId = newFile.id;
      }

      const {
        title,
        subtitle,
        actionType,
        actionUrl,
        productId,
        categoryId,
        position,
        priority,
        isActive,
        startsAt,
        endsAt,
      } = parsed.data;

      return tx.banner.update({
        where: { id: bannerId },
        data: {
          ...(title !== undefined && { title }),
          ...(subtitle !== undefined && { subtitle }),
          ...(actionType !== undefined && { actionType }),
          ...(actionUrl !== undefined && { actionUrl: actionUrl || null }),
          ...(productId !== undefined && { productId: productId || null }),
          ...(categoryId !== undefined && { categoryId: categoryId || null }),
          ...(position !== undefined && { position }),
          ...(priority !== undefined && { priority }),
          ...(isActive !== undefined && { isActive }),
          ...(startsAt !== undefined && { startsAt: startsAt ? new Date(startsAt) : null }),
          ...(endsAt !== undefined && { endsAt: endsAt ? new Date(endsAt) : null }),
          imageId: newDesktopImageId,
          mobileImageId: newMobileImageId,
        },
        include: {
          image: true,
          mobileImage: true,
          product: { select: { id: true, title: true } },
          category: { select: { id: true, name: true } },
        },
      });
    }, { maxWait: 5000, timeout: 15000 });

    return res.status(200).json({
      success: true,
      message: "Banner updated successfully",
      data: updatedBanner,
    });
  } catch (error) {
    console.error("updateBanner error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * DELETE /api/v1/banner/:bannerId
 * Soft-deletes a banner.
 */
export const deleteBanner = async (req: AuthRequest, res: Response) => {
  try {
    const { bannerId } = req.params;

    const banner = await prisma.banner.findUnique({
      where: { id: bannerId, isDeleted: false },
    });
    if (!banner) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }

    await prisma.banner.update({
      where: { id: bannerId },
      data: { isDeleted: true, deletedAt: new Date(), isActive: false },
    });

    return res
      .status(200)
      .json({ success: true, message: "Banner deleted successfully" });
  } catch (error) {
    console.error("deleteBanner error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * PATCH /api/v1/banner/:bannerId/toggle
 * Admin toggles isActive status of a banner.
 */
export const toggleBannerStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { bannerId } = req.params;

    const banner = await prisma.banner.findUnique({
      where: { id: bannerId, isDeleted: false },
    });
    if (!banner) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }

    const updated = await prisma.banner.update({
      where: { id: bannerId },
      data: { isActive: !banner.isActive },
      select: { id: true, isActive: true },
    });

    return res.status(200).json({
      success: true,
      message: `Banner ${updated.isActive ? "activated" : "deactivated"} successfully`,
      data: updated,
    });
  } catch (error) {
    console.error("toggleBannerStatus error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * GET /api/v1/banner/admin
 * Admin gets ALL banners (including inactive/deleted) with pagination.
 * Query: page, limit, position, isActive, includeDeleted
 */
export const getAllBannersAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const includeDeleted = req.query.includeDeleted === "true";
    const positionFilter = req.query.position as BannerPosition | undefined;
    const isActiveFilter =
      req.query.isActive !== undefined
        ? req.query.isActive === "true"
        : undefined;

    const where: any = {};
    if (!includeDeleted) where.isDeleted = false;
    if (positionFilter) where.position = positionFilter;
    if (isActiveFilter !== undefined) where.isActive = isActiveFilter;

    const [banners, total] = await Promise.all([
      prisma.banner.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        include: {
          image: true,
          mobileImage: true,
          product: { select: { id: true, title: true } },
          category: { select: { id: true, name: true } },
        },
      }),
      prisma.banner.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Banners fetched successfully",
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: banners,
    });
  } catch (error) {
    console.error("getAllBannersAdmin error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * GET /api/v1/banner/public
 * Public endpoint — returns only active, non-deleted banners.
 * Query: position (required for targeted fetching), limit
 */
export const getPublicBanners = async (req: Request, res: Response) => {
  try {
    const position = req.query.position as BannerPosition | undefined;
    const limit = Number(req.query.limit) || 20;
    const now = new Date();

    const where: any = {
      isActive: true,
      isDeleted: false,
      OR: [
        { startsAt: null },
        { startsAt: { lte: now } },
      ],
      AND: [
        {
          OR: [
            { endsAt: null },
            { endsAt: { gte: now } },
          ],
        },
      ],
    };

    if (position) where.position = position;

    const banners = await prisma.banner.findMany({
      where,
      take: limit,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: {
        image: true,
        mobileImage: true,
        product: { select: { id: true, title: true } },
        category: { select: { id: true, name: true } },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Banners fetched successfully",
      data: banners,
    });
  } catch (error) {
    console.error("getPublicBanners error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * GET /api/v1/banner/:bannerId
 * Get a single banner by ID (admin use).
 */
export const getBannerById = async (req: AuthRequest, res: Response) => {
  try {
    const { bannerId } = req.params;

    const banner = await prisma.banner.findUnique({
      where: { id: bannerId },
      include: {
        image: true,
        mobileImage: true,
        product: { select: { id: true, title: true } },
        category: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!banner || banner.isDeleted) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }

    return res.status(200).json({ success: true, data: banner });
  } catch (error) {
    console.error("getBannerById error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
