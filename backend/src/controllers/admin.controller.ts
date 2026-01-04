import { Request,Response } from "express";
import z from "zod";
import { prisma } from "../config/prisma.js";



const couponSchema = z.object({
    code:z.string(),
    discountType:z.enum(["PERCENT","FLAT"]),
    discountValue:z.number().min(0),
    usageLimit:z.number().min(1),
    maxDiscount:z.number().min(1),
    minCartValue:z.number().min(1),
    expiresAt:z.date(),
    isActive:z.boolean().optional()
})
export const createCoupon = async(req:Request,res:Response)=>{
    try {
        const parsed = couponSchema.safeParse(req.body)
        if(!parsed.success){
            return res.status(400).json({
                success:false,
                message:parsed.error
            })
        }

        const {code,discountType,discountValue,usageLimit,maxDiscount,minCartValue,expiresAt,isActive=true} = parsed.data
        const couponExist = await prisma.coupon.findUnique({
            where:{code}
        })
        if(couponExist){
            return res.status(400).json({success:false,message:"Coupon already exist with same code"})
        }
        if(discountType === "PERCENT" && discountValue === 100){
            return res.status(400).json({success:false,message:"This could make price 0"})
        }

        const newCoupon = await prisma.coupon.create({
            data:parsed.data
        })
        return res.status(201).json({success:true,message:`New Coupon created with code ${newCoupon.code}`})
    } catch (error) {
        console.error("create coupon error",error)
        return res.status(500).json({success:false,message:"Internal Server Error"})
    }
}

