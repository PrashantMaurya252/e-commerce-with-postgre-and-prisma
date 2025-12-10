import dotenv from 'dotenv'
dotenv.config()

import app from './app.js'
import connectDB from './utils/connectToDB.js'
import "./config/cloudinary.js"
const PORT = process.env.PORT

console.log("PORT",PORT)

connectDB()

app.listen(PORT,()=>{
    console.log(`Server is running at port ${PORT}`)
})