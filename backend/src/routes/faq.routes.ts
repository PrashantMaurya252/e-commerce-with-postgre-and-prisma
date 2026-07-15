import express from "express";
import { auth } from "../middlewares/auth.js";
import { authorize } from "../middlewares/authorize.js";
import {
  createFaq,
  updateFaq,
  deleteFaq,
  toggleFaqStatus,
  getAllFaqs,
  getFaqById,
  semanticFaqSearch,
} from "../controllers/faq.controller.js";

const faqRouter = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
// GET  /api/v1/faq?page=1&limit=20&search=refund
// GET  /api/v1/faq/:faqId
// POST /api/v1/faq/semantic-search  { query: "how do I return a product?" }
faqRouter.get("/", getAllFaqs);
faqRouter.post("/semantic-search", semanticFaqSearch);
faqRouter.get("/:faqId", getFaqById);

// ── Admin (protected) ─────────────────────────────────────────────────────────
// POST   /api/v1/faq/create
// PUT    /api/v1/faq/:faqId
// DELETE /api/v1/faq/:faqId
// PATCH  /api/v1/faq/:faqId/toggle
faqRouter.post("/create", auth, authorize, createFaq);
faqRouter.put("/:faqId", auth, authorize, updateFaq);
faqRouter.delete("/:faqId", auth, authorize, deleteFaq);
faqRouter.patch("/:faqId/toggle", auth, authorize, toggleFaqStatus);

export default faqRouter;
