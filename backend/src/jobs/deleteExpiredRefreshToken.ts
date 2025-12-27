import { prisma } from "../config/prisma.js"
import cron from 'node-cron'

cron.schedule("*/15 * * * *",async()=>{
    try {
        const refreshToken =await prisma.refreshToken.deleteMany({where:{
        expiresAt:{
            lt:new Date()
        }
    }})
    console.log(`Deleted ${refreshToken.count} expired refresh token `)
    } catch (error) {
        console.error("delete expired refresh token",error)
    }
    
})