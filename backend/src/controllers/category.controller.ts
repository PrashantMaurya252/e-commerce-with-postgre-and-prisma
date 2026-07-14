import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { uploadToCloudinary } from "../utils/helper.js";
import { AuthRequest } from "../middlewares/auth.js";
import { FileType, FilePurpose } from "@prisma/client";

const categorySchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  isActive: z.union([z.boolean(), z.string().transform((val) => val === 'true')]).optional(),
});

export const addCategory = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    const { name, label, isActive } = parsed.data;

    // Check if category already exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { name },
          { label }
        ]
      }
    });

    if (existingCategory) {
      return res.status(400).json({ success: false, message: "Category with this name or label already exists" });
    }

    let fileData = undefined;

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const file = req.files[0];
      const result = await uploadToCloudinary(file as any);
      fileData = {
        url: result?.secure_url,
        publicId: result?.public_id,
        type: file.mimetype.startsWith("video") ? FileType.VIDEO : FileType.IMAGE,
        filePurpose: FilePurpose.OTHER,
      };
    }

    const category = await prisma.category.create({
      data: {
        name,
        label,
        isActive: isActive !== undefined ? isActive : true,
        ...(fileData && {
          file: {
            create: fileData
          }
        })
      },
      include: { file: true }
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("Add category error", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
  isActive: z.union([z.boolean(), z.string().transform((val) => val === 'true')]).optional(),
});

export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = updateCategorySchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: { file: true }
    });

    if (!existingCategory) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const dataToBeUpdate = Object.fromEntries(
      Object.entries(parsed.data).filter(([_, value]) => value !== undefined)
    );

    let fileData = undefined;

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const file = req.files[0];
      const result = await uploadToCloudinary(file as any);
      fileData = {
        url: result?.secure_url,
        publicId: result?.public_id,
        type: file.mimetype.startsWith("video") ? FileType.VIDEO : FileType.IMAGE,
        filePurpose: FilePurpose.OTHER,
      };
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        ...dataToBeUpdate,
        ...(fileData && {
          file: {
            upsert: {
              create: fileData,
              update: fileData,
            }
          }
        })
      },
      include: { file: true }
    });

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    console.error("Update category error", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const { includeDeleted } = req.query;

    let where: any = {};
    if (includeDeleted !== 'true') {
      where.isDeleted = false;
    }

    const categories = await prisma.category.findMany({
      where,
      include: { file: true },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: categories,
    });
  } catch (error) {
    console.error("Get categories error", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    // Soft delete
    await prisma.category.update({
      where: { id },
      data: {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date()
      }
    });

    return res.status(200).json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete category error", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
