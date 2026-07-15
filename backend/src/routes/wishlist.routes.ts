import { Router } from "express";

import { getWishlistItems, toggleWishlistItem } from "../controllers/wishlist.controller.js";
import { auth } from "../middlewares/auth.js";

const router = Router();

router.get("/", auth, getWishlistItems);
router.post("/toggle/:productId", auth, toggleWishlistItem);

export default router;
