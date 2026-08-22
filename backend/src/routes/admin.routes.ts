import express from 'express'
import { auth } from '../middlewares/auth.js'
import { authorize, authorizeRoles } from '../middlewares/authorize.js'
import { createCoupon, deleteCoupon, getAllCoupon, updateCoupon, wipeAllData, getAllOrdersForAdmin, updateOrderAdmin, getDashboardStats, getAdminUsers, toggleUserStatus, getAdminProductsWithReviews, deleteReviewAdmin, getAdminOrderById, updatePaymentStatusAdmin, getRolesAndPermissions, createRole, updateRole, deleteRole, assignRolesToUser, assignPermissionToRoles, getAssignedRoles, getAssignedPermissions } from '../controllers/admin.controller.js'

const adminRoutes = express.Router()

adminRoutes.use(auth)
adminRoutes.use(authorizeRoles("SUPER_ADMIN"))

adminRoutes.post("/create-coupon", createCoupon)
adminRoutes.put("/update-coupon", updateCoupon)
adminRoutes.patch("/remove-coupon", deleteCoupon)
adminRoutes.get("/get-all-coupons", getAllCoupon)

// Orders
adminRoutes.get("/orders", getAllOrdersForAdmin)
adminRoutes.get("/orders/:orderId", getAdminOrderById)
adminRoutes.patch("/orders/:orderId", updateOrderAdmin)
adminRoutes.patch("/orders/:orderId/payment", updatePaymentStatusAdmin)

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

// Roles and Permissions
adminRoutes.get("/roles-permissions", getRolesAndPermissions)
adminRoutes.post("/add-role", createRole)
adminRoutes.put("/update-role/:roleId", updateRole)
adminRoutes.delete("/delete-role/:roleId", deleteRole)

adminRoutes.post("/assign-role", assignRolesToUser)
adminRoutes.post("assign-permissions", assignPermissionToRoles)
adminRoutes.get("/get-user-roles/:userId", getAssignedRoles)
adminRoutes.get("/get-assigned-permissions/:roleId", getAssignedPermissions)

export default adminRoutes
