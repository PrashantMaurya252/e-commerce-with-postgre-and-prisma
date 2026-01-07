import express, { Request, Response } from 'express'
import Stripe from 'stripe'
import {prisma} from '../config/prisma.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)
const router = express.Router()

router.post('/create-payment-intent', async (req:Request, res:Response) => {
  try {
    const { amount, orderId } = req.body; 
    // amount should be in paise (e.g. ₹499 = 49900)
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success:false,message:"Unauthorized" });
    }

    // Minimum ₹50 (5000 paise) for INR
    if (!amount || amount < 5) {
      return res.status(400).json({ success:false,message:"Invalid Amount" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // paise
      currency: 'inr',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        orderId,
        userId,
      },
      // customer is OPTIONAL (explained below)
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

export default router
