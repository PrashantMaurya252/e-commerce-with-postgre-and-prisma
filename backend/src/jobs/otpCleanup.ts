import cron from 'node-cron'
import {prisma} from '../config/prisma.js'

cron.schedule("*/15 * * * *",async()=>{
    try {
        const result = await prisma.otp.deleteMany({
        where:{
            OR:[
                {expiresAt:{lt:new Date()}},
                {isUsed:true}
            ]
        }
    });
    console.log("expired otp cleaned")
    console.log("OTP cleanup:", {
      deletedCount: result.count,
      executedAt: new Date().toISOString(),
    });
    } catch (error) {
        console.error("otp cleanup worker error",error)
    }
})

