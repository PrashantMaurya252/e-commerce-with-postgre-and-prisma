import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { cartTotal } from "../utils/helper.js";



export const applyCoupon = async(req:Request,res:Response)=>{
    try {
        const userId = req.user?.userId
        const {code} = req.body
        if(!userId){
            return res.status(401).json({success:false,message:"Unauthorize"})
        }

        const cart = await prisma.cart.findUnique({where:{userId},include:{items:{include:{product:true}}}})
        if(!cart || cart.items.length === 0){
            return res.status(400).json({success:false,message:"Cart Empty"})
        }
        if(cart.locked){
            return res.status(400).json({success:false,message:"Cart is already locked for checkout"})
        }

        const coupon = await prisma.coupon.findUnique({where:{code},include:{couponUsages:true}})
        if(!coupon || !coupon.isActive){
            return res.status(400).json({success:false,message:"coupon usage limit exceeded"})
        }

        if(coupon.expiresAt < new Date()){
            return res.status(400).json({success:false,message:"Coupon has expired"})
        }
        if(coupon.usageLimit && coupon.couponUsages.length > coupon.usageLimit){
            return res.status(400).json({success:false,message:"Usage limit exceeded"})
        }

        const usedByUser = await prisma.couponUsage.findUnique({
            where:{
                couponId_userId:{
                    couponId:coupon.id,
                    userId
                }
            }
        })
        if(usedByUser){
            return res.status(400).json({success:false,message:"This token already used by you"})
        }

        const subtotal = cartTotal(cart.items) || 0
        if(subtotal < coupon.minCartValue){
              return res.status(400).json({success:false,message:"You cart value is too low"})
        }

        let discount = coupon.discountType === 'PERCENT' ? Math.floor((subtotal*coupon.discountValue)/100) : coupon.discountValue
        if(coupon.maxDiscount){
            discount = Math.min(coupon.maxDiscount,discount)
        }

        return res.status(200).json({success:true,subtotal,discount,total:Math.max(subtotal-discount,0),coupon:coupon.code})
    } catch (error) {
        console.error("apply coupon error",error)
        return res.status(500).json({success:false,message:"Internal Server Error"})
    }
}