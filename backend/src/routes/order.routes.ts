import express from 'express'
import { auth } from '../middlewares/auth.js'
import { allOrders } from '../controllers/order.controller.js'

const orderRoutes = express.Router()

// const app = express()
// app.use(auth)

orderRoutes.get("/all-orders",auth,allOrders)

export default orderRoutes

