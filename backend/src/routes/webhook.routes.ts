import express, { Request, Response } from "express";
import Stripe from "stripe";
import {prisma} from '../config/prisma.js'


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!,{apiVersion:"2025-12-15.clover"})
const router = express.Router()

router.post("/webhook",express.raw({type:"application/json"}),async(req:Request,res:Response)=>{
    const sig = req.headers['stripe-signature']
        let event:Stripe.Event
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig as string,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (error:any) {
        console.error("Stripe Webhook error")
        return res.status(400).send(`Webhook Error: ${error.message}`)
    }

    try {
        switch(event.type){
        case 'payment_intent.succeeded':{
            const paymentIntent = event.data.object as Stripe.PaymentIntent
            await handlePaymentSucceeded(paymentIntent)
            break;
        }
        case 'payment_intent.payment_failed':{
            const paymentIntent = event.data.object as Stripe.PaymentIntent
            await handlePaymentFailed(paymentIntent)
            break;
        }
        default:
            console.log(`Unhandled event type: ${event.type}`)
    }
    res.json({received:true})
    } catch (error) {
        console.error("Webhook Error",error)
        res.status(500).send("Webhook handler failed")
    }
    
})

const handlePaymentSucceeded =async(paymentIntent:Stripe.PaymentIntent)=>{
    try {
        const {orderId,userId} = paymentIntent.metadata
        if(!orderId || ! userId){
            console.error("Missing OrderId or userId in payment intent meta data")
            return 
        }

        await prisma.$transaction(async(tx)=>{
            const payment = await tx.payment.upsert({
                where:{orderId},
                create:{
                    orderId,
                    amount:paymentIntent.amount,
                    currency:paymentIntent.currency,
                    status:'SUCCEEDED',
                    stripePaymentIntentId:paymentIntent.id,
                    stripeChargeId:paymentIntent.latest_charge as string,
                },

                
                update:{
                    status:"SUCCEEDED",
                    stripePaymentIntentId:paymentIntent.id,
                    stripeChargeId:paymentIntent.latest_charge as string
                }
            })

            await tx.order.update({where:{id:orderId},
            data:{
                status:'PAID'
            }})
        })

        console.log(`Payment created for orderId: ${orderId}`)
    } catch (error) {
        console.log("Error Handling Payment Success",error)
    }
}

const handlePaymentFailed = async(paymentIntent:Stripe.PaymentIntent)=>{
    try {
        const {orderId,userId} = paymentIntent.metadata
        if(!orderId || ! userId){
            console.error("Missing OrderId or userId in payment intent meta data")
            return 
        }

        await prisma.payment.upsert({where:{orderId},
        create:{
            orderId,
            amount:paymentIntent.amount,
            currency:paymentIntent.currency,
            status:"FAILED",
            stripePaymentIntentId:paymentIntent.id
        },
        update:{status:"FAILED"}
    })
    console.log(`Payment failed for order ${orderId}`)
    } catch (error) {
        console.error("Handle Payment Failed Error",error)
    }
}

export default router