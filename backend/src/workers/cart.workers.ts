import { Job, Worker } from "bullmq";
import { prisma } from "../config/prisma.js";
import { connection } from "../redis.js";



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
    const {subject,body} = MESSAGES[stage]
    // await sendMail(user?.email,subject,body)
},{
    connection,concurrency:5
})