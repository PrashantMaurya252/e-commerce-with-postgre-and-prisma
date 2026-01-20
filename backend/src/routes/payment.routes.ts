import express, { Request, Response } from 'express'
import Stripe from 'stripe'
import {prisma} from '../config/prisma.js'
import { auth } from '../middlewares/auth.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)
const router = express.Router()

router.post('/create-payment-intent',auth, async (req:Request, res:Response) => {
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

    const paymentIntent = await stripe.paymentIntents.create({
      amount: order.total, // paise
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
