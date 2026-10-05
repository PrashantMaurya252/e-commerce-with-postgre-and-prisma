import express, { Request, Response } from 'express'
import Stripe from 'stripe'
import {prisma} from '../config/prisma.js'
import { auth, AuthRequest } from '../middlewares/auth.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)
const router = express.Router()

router.post('/create-payment-intent',auth, async (req:AuthRequest, res:Response) => {
  try {
    const { orderId } = req.body; 
    // amount should be in paise (e.g. ₹499 = 49900)
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success:false,message:"Unauthorized" });
    }

    const order = await prisma.order.findUnique({where:{id:orderId}})
    if(!order){
      return res.status(404).json({
        success:false,
        message:"Order not found"
      })
    }

    // Minimum ₹50 (5000 paise) for INR
    if (!order.total || order.total < 5) {
      return res.status(400).json({ success:false,message:"Invalid Amount" });
    }

    const customer = await stripe.customers.create({
  name: "Prashant Maurya",
  email: "mauryaprashant202@gmail.com",
  address: {
    line1: "Vindhyavasini Nagar",
    city: "Gorakhpur",
    state: "Uttar Pradesh",
    postal_code: "273001",
    country: "IN",
  },
})


    const paymentIntent = await stripe.paymentIntents.create({
      amount: order.total*100, // paise
      currency: 'inr',
      description:`Order ${orderId} purchase`,
      customer:customer.id,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        orderId,
        userId,
      },
      // customer is OPTIONAL (explained below)
    });

    await prisma.payment.update({
      where: { orderId },
      data: { stripePaymentIntentId: paymentIntent.id }
    });

    return res.status(200).json({
      success:true,
      data:{
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }
      
    });
  } catch (error: any) {
    console.error('Payment Intent Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.post('/verify-payment', async (req: Request, res: Response) => {
  try {
    const { paymentIntentId } = req.body;
    if (!paymentIntentId) {
      return res.status(400).json({ success: false, message: "Missing payment intent ID" });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!paymentIntent) {
      return res.status(404).json({ success: false, message: "Payment intent not found" });
    }

    const { orderId, userId } = paymentIntent.metadata;

    if (paymentIntent.status === "succeeded") {
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (existingOrder && existingOrder.status !== "PAID") {
        await prisma.payment.upsert({
          where: { orderId },
          create: {
            orderId,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: "SUCCEEDED",
            stripePaymentIntentId: paymentIntent.id,
            stripeChargeId: (paymentIntent.latest_charge as string) || "",
          },
          update: {
            status: "SUCCEEDED",
            stripePaymentIntentId: paymentIntent.id,
            stripeChargeId: (paymentIntent.latest_charge as string) || "",
          },
        });

        await prisma.order.update({
          where: { id: orderId },
          data: { status: "PAID" },
        });

        const cart = await prisma.cart.findUnique({ where: { userId } });
        if (cart) {
          await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
          await prisma.cart.update({ where: { id: cart.id }, data: { total: 0 } });
        }
      }
    }

    return res.status(200).json({ success: true, status: paymentIntent.status });
  } catch (error: any) {
    console.error('Verify Payment Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router
