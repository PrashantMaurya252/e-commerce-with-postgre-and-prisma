import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import hpp from 'hpp'
import cookieParser  from 'cookie-parser'
import authRoutes from "./routes/auth.routes.js"
import productRoutes from './routes/product.routes.js'




const app = express()
app.use(helmet())
app.use(cors({
    origin:["http://localhost:3000"],
    credentials:true,
    methods:["GET","POST","PUT","PATCH","DELETE"],
    allowedHeaders:["Content-Type","Authorization"]
}))

app.use(hpp())
app.use(cookieParser())
app.use(express.json({limit:'10mb'}))
app.use(express.urlencoded({extended:true}))
// routes
app.use("/api/v1/auth",authRoutes)
app.use("/api/v1/product",productRoutes)

export default app

