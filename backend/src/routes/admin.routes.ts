import express from 'express'
import { auth } from '../middlewares/auth.js'
import { authorize } from '../middlewares/authorize.js'
import { createCoupon, deleteCoupon, getAllCoupon, updateCoupon, wipeAllData } from '../controllers/admin.controller.js'

const adminRoutes = express.Router()

adminRoutes.use(auth)
adminRoutes.use(authorize)

adminRoutes.post("/create-coupon",createCoupon)
adminRoutes.put("/update-coupon",updateCoupon)
adminRoutes.patch("/remove-coupon",deleteCoupon)
adminRoutes.get("/get-all-coupons",getAllCoupon)

// Danger Zone
adminRoutes.delete("/wipe-data", wipeAllData)

export default adminRoutes
