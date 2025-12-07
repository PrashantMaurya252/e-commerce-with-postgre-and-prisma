import dotenv from 'dotenv'
dotenv.config()
console.log("DATABASE_URL:", process.env.DATABASE_URL);
import app from './app.js'
import connectDB from './utils/connectToDB.js'
const PORT = process.env.PORT

console.log("PORT",PORT)

connectDB()

app.listen(PORT,()=>{
    console.log(`Server is running at port ${PORT}`)
})