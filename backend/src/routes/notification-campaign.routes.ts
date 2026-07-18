import express from "express";
import { auth } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";
import {
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getAllCampaigns,
  getCampaignById,
} from "../controllers/notification-campaign.controller.js";

const notificationCampaignRouter = express.Router();

// All routes require admin auth
notificationCampaignRouter.use(auth);
notificationCampaignRouter.use(authorize);

// GET  /api/v1/notification-campaign            → list all campaigns (paginated)
// POST /api/v1/notification-campaign/create     → create + optionally schedule
notificationCampaignRouter.get("/", getAllCampaigns);
notificationCampaignRouter.post("/create", createCampaign);

// GET    /api/v1/notification-campaign/:campaignId  → single campaign details
// PUT    /api/v1/notification-campaign/:campaignId  → update (scheduled only)
// DELETE /api/v1/notification-campaign/:campaignId  → delete (scheduled only)
notificationCampaignRouter.get("/:campaignId", getCampaignById);
notificationCampaignRouter.put("/:campaignId", updateCampaign);
notificationCampaignRouter.delete("/:campaignId", deleteCampaign);

export default notificationCampaignRouter;
