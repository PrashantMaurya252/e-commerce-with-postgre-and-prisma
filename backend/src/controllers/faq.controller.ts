import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AuthRequest } from "../middlewares/auth.js";
import { generateEmbedding } from "../utils/gemeni-helper.js";

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const faqSchema = z.object({
  question: z.string().min(3, "Question must be at least 3 characters"),
  answer: z.string().min(5, "Answer must be at least 5 characters"),
  isActive: z
    .union([z.boolean(), z.string().transform((v) => v === "true")])
    .optional(),
});

const updateFaqSchema = faqSchema.partial();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Upserts the embedding for a given FAQ id */
const upsertFaqEmbedding = async (
  faqId: string,
  question: string,
  answer: string
) => {
  const text = `${question}\n${answer}`;
  const embedding = await generateEmbedding(text);
  const vectorStr = `[${embedding.join(",")}]`;

  await prisma.$executeRaw`
    INSERT INTO faq_embeddings (id, faid, content, embedding, "updatedAt")
    VALUES (
      ${crypto.randomUUID()},
      ${faqId},
      ${text},
      ${vectorStr}::vector,
      NOW()
    )
    ON CONFLICT (faid) DO UPDATE
      SET content   = EXCLUDED.content,
          embedding = EXCLUDED.embedding,
          "updatedAt" = NOW()
  `;
};

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /api/v1/faq
 * Admin creates a new FAQ. Generates and stores a semantic embedding.
 */
export const createFaq = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = faqSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    const { question, answer, isActive } = parsed.data;

    const faq = await prisma.faq.create({
      data: {
        question,
        answer,
        isActive: isActive ?? true,
      },
    });

    // Generate and store embedding (non-blocking failure OK — don't fail the request)
    try {
      await upsertFaqEmbedding(faq.id, question, answer);
    } catch (embeddingError) {
      console.error("FAQ embedding generation failed (non-fatal):", embeddingError);
    }

    return res.status(201).json({
      success: true,
      message: "FAQ created successfully",
      data: faq,
    });
  } catch (error) {
    console.error("createFaq error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * PUT /api/v1/faq/:faqId
 * Admin updates a FAQ. Re-generates the embedding if question or answer changed.
 */
export const updateFaq = async (req: AuthRequest, res: Response) => {
  try {
    const { faqId } = req.params;

    const existing = await prisma.faq.findUnique({ where: { id: faqId } });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "FAQ not found" });
    }

    const parsed = updateFaqSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    const { question, answer, isActive } = parsed.data;

    const updatedFaq = await prisma.faq.update({
      where: { id: faqId },
      data: {
        ...(question !== undefined && { question }),
        ...(answer !== undefined && { answer }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    // Re-generate embedding if content changed
    const contentChanged = question !== undefined || answer !== undefined;
    if (contentChanged) {
      try {
        await upsertFaqEmbedding(
          faqId,
          updatedFaq.question,
          updatedFaq.answer
        );
      } catch (embeddingError) {
        console.error("FAQ embedding update failed (non-fatal):", embeddingError);
      }
    }

    return res.status(200).json({
      success: true,
      message: "FAQ updated successfully",
      data: updatedFaq,
    });
  } catch (error) {
    console.error("updateFaq error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * DELETE /api/v1/faq/:faqId
 * Admin hard-deletes a FAQ (embedding is cascade-deleted via schema).
 */
export const deleteFaq = async (req: AuthRequest, res: Response) => {
  try {
    const { faqId } = req.params;

    const existing = await prisma.faq.findUnique({ where: { id: faqId } });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "FAQ not found" });
    }

    await prisma.faq.delete({ where: { id: faqId } });

    return res
      .status(200)
      .json({ success: true, message: "FAQ deleted successfully" });
  } catch (error) {
    console.error("deleteFaq error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * PATCH /api/v1/faq/:faqId/toggle
 * Admin toggles the isActive status of a FAQ.
 */
export const toggleFaqStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { faqId } = req.params;

    const existing = await prisma.faq.findUnique({ where: { id: faqId } });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "FAQ not found" });
    }

    const updated = await prisma.faq.update({
      where: { id: faqId },
      data: { isActive: !existing.isActive },
      select: { id: true, isActive: true },
    });

    return res.status(200).json({
      success: true,
      message: `FAQ ${updated.isActive ? "activated" : "deactivated"} successfully`,
      data: updated,
    });
  } catch (error) {
    console.error("toggleFaqStatus error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * GET /api/v1/faq
 * Public — returns all active FAQs. Admin can pass ?includeInactive=true to see all.
 * Query: page, limit, search (keyword filter on question/answer)
 */
export const getAllFaqs = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string | undefined;
    const includeInactive = req.query.includeInactive === "true";

    const where: any = {};
    if (!includeInactive) where.isActive = true;

    if (search) {
      where.OR = [
        { question: { contains: search, mode: "insensitive" } },
        { answer: { contains: search, mode: "insensitive" } },
      ];
    }

    const [faqs, total] = await Promise.all([
      prisma.faq.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          question: true,
          answer: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.faq.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      message: "FAQs fetched successfully",
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: faqs,
    });
  } catch (error) {
    console.error("getAllFaqs error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * GET /api/v1/faq/:faqId
 * Get a single FAQ by ID (admin use — works for any isActive state).
 */
export const getFaqById = async (req: Request, res: Response) => {
  try {
    const { faqId } = req.params;

    const faq = await prisma.faq.findUnique({
      where: { id: faqId },
    });

    if (!faq) {
      return res
        .status(404)
        .json({ success: false, message: "FAQ not found" });
    }

    return res.status(200).json({ success: true, data: faq });
  } catch (error) {
    console.error("getFaqById error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * POST /api/v1/faq/semantic-search
 * Public — semantic search using vector similarity on FAQ embeddings.
 * Body: { query: string }
 */
export const semanticFaqSearch = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "query is required" });
    }

    const embedding = await generateEmbedding(query.trim());
    const vectorStr = `[${embedding.join(",")}]`;

    const results: any[] = await prisma.$queryRaw`
      SELECT
        f.id,
        f.question,
        f.answer,
        f."isActive",
        f."createdAt",
        1 - (fe.embedding <=> ${vectorStr}::vector) AS similarity
      FROM faq_embeddings fe
      JOIN "Faq" f ON f.id = fe.faid
      WHERE f."isActive" = true
      ORDER BY fe.embedding <=> ${vectorStr}::vector
      LIMIT 10
    `;

    return res.status(200).json({
      success: true,
      message: "Semantic FAQ search results",
      data: results,
    });
  } catch (error) {
    console.error("semanticFaqSearch error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
