import dotenv from 'dotenv'
dotenv.config()
import app from '/.app.ts'
const PORT = process.env.PORT


app.listen(PORT,()=>{
    console.log(`Server is running at port ${PORT}`)
})