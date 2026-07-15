import { Router } from "express";
import { AuthGuard } from "../middlewares/auth.js";
import { getWishlistItems, toggleWishlistItem } from "../controllers/wishlist.controller.js";

const router = Router();

router.get("/", AuthGuard, getWishlistItems);
router.post("/toggle/:productId", AuthGuard, toggleWishlistItem);

export default router;
