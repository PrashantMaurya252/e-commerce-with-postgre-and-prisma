import dotenv from 'dotenv'
dotenv.config()

import app from './app.js'
import connectDB from './utils/connectToDB.js'
import "./config/cloudinary.js"
import "./jobs/otpCleanup.js"
import "./jobs/deleteExpiredRefreshToken.js"
import "./jobs/coupon.js"
// import "./config/redis.js"
import logger from './utils/logger.js'
import { scheduleDailyReport } from './queues/report.queue.js'
const PORT = process.env.PORT


connectDB()

app.listen(PORT,async()=>{
    console.log(`Server is running at port ${PORT}`)
    await scheduleDailyReport()
    // logger.info(`Server is running at PORT ${PORT}`)
})