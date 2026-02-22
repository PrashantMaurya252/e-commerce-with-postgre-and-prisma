import dotenv from 'dotenv'
dotenv.config()

import app from './app.js'
import connectDB from './utils/connectToDB.js'
import "./config/cloudinary.js"
import "./jobs/otpCleanup.js"
import "./jobs/deleteExpiredRefreshToken.js"
import "./jobs/coupon.js"
import "./config/redis.js"
const PORT = process.env.PORT


connectDB()

app.listen(PORT,()=>{
    console.log(`Server is running at port ${PORT}`)
})