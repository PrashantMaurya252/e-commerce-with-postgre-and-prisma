import express, { Request, Response } from "express";
import Stripe from "stripe";
import { prisma } from "../config/prisma.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

const router = express.Router();

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error`);
    }

    console.log("🔔 Stripe Webhook Received:", event.type);

    // ✅ IMPORTANT: ACK Stripe immediately
    res.status(200).json({ received: true });

    // 🔽 Handle logic AFTER responding
    try {
      switch (event.type) {
        case "payment_intent.succeeded":
          await handlePaymentSucceeded(
            event.data.object as Stripe.PaymentIntent
          );
          break;

        case "payment_intent.payment_failed":
          await handlePaymentFailed(
            event.data.object as Stripe.PaymentIntent
          );
          break;

        default:
          // silently ignore other events
          break;
      }
    } catch (error) {
      console.error("❌ Webhook async handler error:", error);
    }
  }
);

/* ===========================
   HANDLERS
=========================== */

const handlePaymentSucceeded = async (
  paymentIntent: Stripe.PaymentIntent
) => {
  const { orderId, userId } = paymentIntent.metadata;

  if (!orderId || !userId) {
    console.error("❌ Missing orderId or userId in metadata");
    return;
  }

  // ✅ Idempotency check (VERY IMPORTANT)
  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!existingOrder) {
    console.error("❌ Order not found:", orderId);
    return;
  }

  if (existingOrder.status === "PAID") {
    console.log("⚠️ Order already paid:", orderId);
    return;
  }

  // ✅ Upsert payment (no transaction)
  await prisma.payment.upsert({
    where: { orderId },
    create: {
      orderId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: "SUCCEEDED",
      stripePaymentIntentId: paymentIntent.id,
      stripeChargeId: paymentIntent.latest_charge as string,
    },
    update: {
      status: "SUCCEEDED",
      stripePaymentIntentId: paymentIntent.id,
      stripeChargeId: paymentIntent.latest_charge as string,
    },
  });

  // ✅ Update order
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "PAID",
    },
  });

  // 🔔 Create Notification
  await prisma.notification.create({
    data: {
      title: "Payment Successful",
      description: `Payment for order #${orderId.slice(0, 8).toUpperCase()} was successful.`,
      receiverId: userId,
      channel: "IN_APP",
      type: "SUCCESS",
    }
  });

  console.log(`✅ Payment succeeded for orderId: ${orderId}`);
};

const handlePaymentFailed = async (
  paymentIntent: Stripe.PaymentIntent
) => {
  const { orderId, userId } = paymentIntent.metadata;

  if (!orderId || !userId) {
    console.error("❌ Missing orderId or userId in metadata");
    return;
  }

  await prisma.payment.upsert({
    where: { orderId },
    create: {
      orderId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: "FAILED",
      stripePaymentIntentId: paymentIntent.id,
    },
    update: {
      status: "FAILED",
    },
  });

  // 🔔 Create Notification
  await prisma.notification.create({
    data: {
      title: "Payment Failed",
      description: `Payment for order #${orderId.slice(0, 8).toUpperCase()} failed.`,
      receiverId: userId,
      channel: "IN_APP",
      type: "ERROR",
    }
  });

  console.log(`❌ Payment failed for orderId: ${orderId}`);
};

export default router;
