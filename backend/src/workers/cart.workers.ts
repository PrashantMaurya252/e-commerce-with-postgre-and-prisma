import { Job, Worker } from "bullmq";
import { prisma } from "../config/prisma.js";
import { connection } from "../redis.js";
import { sendEmail } from "../services/email.service.js";


const MESSAGES: Record<string, { subject: string; body: string }> = {
  first: { subject: 'You left something behind!', body: 'Your cart is waiting for you.' },
  second: { subject: 'Still thinking it over?', body: 'Here’s 10% off to complete your order.' },
  final: { subject: 'Last chance', body: 'Your cart will be cleared soon — checkout now.' },
};

new Worker('cart-recovery',async(job:Job)=>{
    const {cartId,userId,stage} = job.data
    const cart = await prisma.cart.findUnique({where:{id:cartId}})
    if(!cart ) return
    const user = await prisma.user.findUnique({where:{id:userId}})
    if (!user || !user.email) return;

    const {subject,body} = MESSAGES[stage]
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; border: 1px solid #eaeaea; border-radius: 10px;">
        <h2 style="color: #333;">${subject}</h2>
        <p style="color: #555; font-size: 16px;">Hi ${user.name || 'there'},</p>
        <p style="color: #555; font-size: 16px; margin-bottom: 30px;">${body}</p>
        <a href="${process.env.DEPLOYED_FRONTEND_LINK || 'http://localhost:3000'}/cart" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Your Cart</a>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">If you already completed your purchase, please ignore this email.</p>
      </div>
    `;
    await sendEmail(user.email, subject, html)

    await prisma.notification.create({
      data: {
        title: subject,
        description: body,
        receiverId: userId,
        channel: "IN_APP",
        type: "INFO",
      }
    });
},{
    connection,concurrency:5
})