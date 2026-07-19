import express from "express";
import { auth } from "../middlewares/auth.js";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", auth, getUserNotifications);
router.patch("/mark-all-read", auth, markAllNotificationsAsRead);
router.patch("/:id/read", auth, markNotificationAsRead);

export default router;
