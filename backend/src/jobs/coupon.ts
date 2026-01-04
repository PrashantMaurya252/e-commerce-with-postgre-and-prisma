import cron from "node-cron";
import { prisma } from "../config/prisma.js";

cron.schedule(
  "0 0 * * *", // every day at 12:00 AM
  async () => {
    try {
      const result = await prisma.coupon.updateMany({
        where: {
          expiresAt: { lt: new Date() },
          isActive: true
        },
        data: { isActive: false }
      });

      console.log(`Expired coupons disabled: ${result.count}`);
    } catch (error) {
      console.error("Expire coupon cron error", error);
    }
  },
  {
    timezone: "Asia/Kolkata"
  }
);
