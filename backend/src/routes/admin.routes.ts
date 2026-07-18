import express from 'express'
import { auth } from '../middlewares/auth.js'
import { authorize } from '../middlewares/authorize.js'
import { createCoupon, deleteCoupon, getAllCoupon, updateCoupon, wipeAllData, getAllOrdersForAdmin, updateOrderAdmin, getDashboardStats, getAdminUsers, toggleUserStatus, getAdminProductsWithReviews, deleteReviewAdmin } from '../controllers/admin.controller.js'

const adminRoutes = express.Router()

adminRoutes.use(auth)
adminRoutes.use(authorize)

adminRoutes.post("/create-coupon",createCoupon)
adminRoutes.put("/update-coupon",updateCoupon)
adminRoutes.patch("/remove-coupon",deleteCoupon)
adminRoutes.get("/get-all-coupons",getAllCoupon)

// Orders
adminRoutes.get("/orders", getAllOrdersForAdmin)
adminRoutes.patch("/orders/:orderId", updateOrderAdmin)

// Dashboard Stats
adminRoutes.get("/dashboard-stats", getDashboardStats)

// User Management
adminRoutes.get("/users", getAdminUsers)
adminRoutes.patch("/users/:userId/status", toggleUserStatus)

// Reviews and Products
adminRoutes.get("/products-reviews", getAdminProductsWithReviews)
adminRoutes.delete("/reviews/:reviewId", deleteReviewAdmin)

// Danger Zone
adminRoutes.delete("/wipe-data", wipeAllData)

export default adminRoutes
