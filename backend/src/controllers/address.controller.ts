import { Response } from "express";
import { prisma } from "../config/prisma.js";
import { AuthRequest } from "../middlewares/auth.js";

/**
 * GET /api/v1/address
 * Fetch all addresses for the logged-in user
 */
export const getAddresses = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: "desc" } // Default address first
    });

    return res.status(200).json({ success: true, data: addresses });
  } catch (error: any) {
    console.error("getAddresses error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * POST /api/v1/address
 * Add a new address
 */
export const addAddress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { line1, line2, landmark, phoneNumber1, phoneNumber2, pincode, city, isDefault } = req.body;

    if (!line1 || !phoneNumber1 || !pincode || !city) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    // If this address is set to default, unset others for this user
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false }
      });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        line1,
        line2,
        landmark,
        phoneNumber1,
        phoneNumber2,
        pincode: Number(pincode),
        city,
        isDefault: Boolean(isDefault)
      }
    });

    return res.status(201).json({ success: true, message: "Address added successfully", data: address });
  } catch (error: any) {
    console.error("addAddress error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
