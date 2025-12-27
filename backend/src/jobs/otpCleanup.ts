import cron from 'node-cron'
import {prisma} from '../config/prisma.js'

cron.schedule("*/15 * * * *",async()=>{
    try {
        await prisma.otp.deleteMany({
        where:{
            OR:[
                {expiresAt:{lt:new Date()}},
                {isUsed:true}
            ]
        }
    });
    console.log("expired otp cleaned")
    } catch (error) {
        console.error("otp cleanup worker error",error)
    }
    
})

