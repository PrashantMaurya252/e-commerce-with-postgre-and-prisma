import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import hpp from 'hpp'
import cookieParser  from 'cookie-parser'

import dotenv from 'dotenv'


const app = express()
app.use(helmet())
app.use(cors({
    origin:'*',
    credentials:true
}))

app.use(hpp())
app.use(cookieParser())
app.use(express.json({limit:'10mb'}))
app.use(express.urlencoded({extended:true}))

export default app

