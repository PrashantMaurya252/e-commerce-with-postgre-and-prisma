import express from "express";
import { auth } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";
import { upload } from "../utils/multer.js";
import {
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
  getAllBannersAdmin,
  getPublicBanners,
  getBannerById,
} from "../controllers/banner.controller.js";

const bannerRouter = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
// GET /api/v1/banner/public?position=HOME_TOP&limit=10
bannerRouter.get("/public", getPublicBanners);

// ── Admin (protected) ─────────────────────────────────────────────────────────
// GET /api/v1/banner/admin?page=1&limit=10&position=HOME_TOP&isActive=true&includeDeleted=false
bannerRouter.get("/admin", auth, authorize, getAllBannersAdmin);

// POST /api/v1/banner  — multipart: fields `image` (required) + `mobileImage` (optional)
bannerRouter.post(
  "/",
  auth,
  authorize,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "mobileImage", maxCount: 1 },
  ]),
  createBanner
);

// GET    /api/v1/banner/:bannerId
// PUT    /api/v1/banner/:bannerId  — multipart: fields `image` + `mobileImage` (both optional)
// DELETE /api/v1/banner/:bannerId  — soft delete
// PATCH  /api/v1/banner/:bannerId/toggle — toggle isActive
bannerRouter.get("/:bannerId", auth, authorize, getBannerById);

bannerRouter.put(
  "/:bannerId",
  auth,
  authorize,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "mobileImage", maxCount: 1 },
  ]),
  updateBanner
);

bannerRouter.delete("/:bannerId", auth, authorize, deleteBanner);
bannerRouter.patch("/:bannerId/toggle", auth, authorize, toggleBannerStatus);

export default bannerRouter;
