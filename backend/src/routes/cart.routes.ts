import express from 'express'
import { addIntoCart, applyCoupon, cartItems, checkout, decreaseFromCart, deleteCartItem, getAllCoupons, getCartItems } from '../controllers/cart.controller.js'
import { auth } from '../middlewares/auth.js'


const cartRouter = express.Router()

cartRouter.get("/cartItems",auth,getCartItems)

cartRouter.post("/apply-coupon",auth,applyCoupon)

cartRouter.post("/checkout",auth,checkout)

cartRouter.put("/add-to-cart/:productId",auth,addIntoCart)
cartRouter.put("/decrease-from-cart/:productId",auth,decreaseFromCart)
cartRouter.delete("/delete-cart-item/:productId",auth,deleteCartItem)
cartRouter.get("/get-all-coupons",auth,getAllCoupons)

export default cartRouter