import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { AuthRequest } from "../middlewares/auth.js";

export const getWishlistItems = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                files: true,
                cartItems: {
                  where: {
                    cart: {
                      userId
                    }
                  },
                  select: {
                    quantity: true
                  }
                }
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!wishlist) {
      return res.status(200).json({ success: true, data: { items: [], total: 0 } });
    }

    return res.status(200).json({
      success: true,
      data: { items: wishlist.items, total: wishlist.total },
    });
  } catch (error) {
    console.error("getWishlistItems Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server Error" });
  }
};

export const toggleWishlistItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { productId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Ensure product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.disabled) {
      return res
        .status(404)
        .json({ success: false, message: "Product not available" });
    }

    // Ensure wishlist exists
    let wishlist = await prisma.wishlist.findUnique({ where: { userId } });
    if (!wishlist) {
      wishlist = await prisma.wishlist.create({ data: { userId } });
    }

    // Check if item is already in wishlist
    const existingItem = await prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId,
        },
      },
    });

    if (existingItem) {
      // Remove from wishlist
      await prisma.$transaction([
        prisma.wishlistItem.delete({ where: { id: existingItem.id } }),
        prisma.wishlist.update({
          where: { id: wishlist.id },
          data: { total: { decrement: 1 } },
        }),
      ]);
      return res
        .status(200)
        .json({ success: true, message: "Removed from wishlist" });
    } else {
      // Add to wishlist
      await prisma.$transaction([
        prisma.wishlistItem.create({
          data: {
            wishlistId: wishlist.id,
            productId,
          },
        }),
        prisma.wishlist.update({
          where: { id: wishlist.id },
          data: { total: { increment: 1 } },
        }),
      ]);
      return res
        .status(200)
        .json({ success: true, message: "Added to wishlist" });
    }
  } catch (error) {
    console.error("toggleWishlistItem Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
