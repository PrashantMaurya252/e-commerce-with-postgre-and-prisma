import { Request,Response } from "express";
import z from "zod";
import { prisma } from "../config/prisma.js";
import { v2 as cloudinary } from "cloudinary";



const couponSchema = z.object({
    code:z.string().trim().toUpperCase(),
    discountType:z.enum(["PERCENT","FLAT"]),
    discountValue:z.number().min(0),
    usageLimit:z.number().min(1).optional(),
    maxDiscount:z.number().min(1).optional(),
    minCartValue:z.number().min(1),
    expiresAt:z.coerce.date(),
    isActive:z.boolean().optional()
})
export const createCoupon = async(req:Request,res:Response)=>{
    try {
        const parsed = couponSchema.safeParse(req.body)
        if(!parsed.success){
            return res.status(400).json({
                success:false,
                message:parsed.error.message
            })
        }

        const {code,discountType,discountValue,usageLimit,maxDiscount,minCartValue,expiresAt,isActive} = parsed.data
        const couponExist = await prisma.coupon.findUnique({
            where:{code}
        })
        if(couponExist){
            return res.status(400).json({success:false,message:"Coupon already exist with same code"})
        }
        if(discountType === "PERCENT" && discountValue >= 100){
            return res.status(400).json({success:false,message:"This could make price 0"})
        }

        if(discountType === "FLAT" && discountValue >= minCartValue){
            return res.status(400).json({success:false,message:"Discount value should be less than minimum cart value"})
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

const updateCouponSchema = z.object({
    code:z.string().trim().toUpperCase(),
    discountType:z.enum(["PERCENT","FLAT"]),
    discountValue:z.number().min(0),
    usageLimit:z.number().min(1).optional(),
    maxDiscount:z.number().min(1).optional(),
    minCartValue:z.number().min(1),
    expiresAt:z.coerce.date(),
    isActive:z.boolean()
}).partial()

export const updateCoupon = async(req:Request,res:Response)=>{
    try {
        const {couponId} = req.params 
        const coupon = await prisma.coupon.findUnique({where:{id:couponId}})
        if(!coupon){
            return res.status(404).json({
                success:false,message:"Coupon not exist"
            })
        }

        const parsed = updateCouponSchema.safeParse(req.body)
        if(!parsed.success){
            return res.status(400).json({success:false,message:parsed.error.message})
        }

        const {code,discountType,discountValue,usageLimit,maxDiscount,minCartValue,expiresAt,isActive} = parsed.data

        if(code){
            const codeExist = await prisma.coupon.findUnique({where:{code}})
        if(codeExist && codeExist.id !== couponId){
            return res.status(400).json({success:false,message:"Code already exist"})
        }
        }
        

        if(discountType === "PERCENT" && discountValue && discountValue >= 100){
            return res.status(400).json({success:false,message:"This could make price 0"})
        }

        if(discountType === "FLAT" && discountValue && minCartValue && discountValue >= minCartValue){
            return res.status(400).json({success:false,message:"Discount value should be less than minimum cart value"})
        }

        const dataTobeUpdate = Object.fromEntries(Object.entries(parsed.data).filter(([_,value])=>value !== undefined))
        const updatedCoupon = await prisma.coupon.update({where:{
            id:couponId
        },
    data:dataTobeUpdate})

    return res.status(200).json({success:true,message:"Coupon Updated Successfully"})
    } catch (error) {
        console.error("Update coupon error",error)
        return res.status(500).json({success:false,message:"Internal Server Error"})
    }
}

export const deleteCoupon = async(req:Request,res:Response)=>{
    try {
        const {couponId} = req.params
        const coupon = await prisma.coupon.findUnique({where:{id:couponId}})
        if(!coupon){
            return res.status(404).json({success:false,message:"Coupon not exist"})
        }
        await prisma.coupon.update({where:{id:couponId},data:{isActive:false}})
        return res.status(200).json({success:true,message:"Coupon delete successfully"})
    } catch (error) {
        console.error("Delete Coupon Error",error)
        return res.status(500).json({success:false,message:"Internal Server Errror"})
    }
}


export const getAllCoupon = async(req:Request,res:Response)=>{
    try {
        const coupons = await prisma.coupon.findMany()
        return res.status(200).json({success:true,data:coupons || []})
    } catch (error) {
        console.error("get all coupons error",error)
        return res.status(500).json({success:false,message:"Internal Server Error"})
    }
}

export const wipeAllData = async (req: Request, res: Response) => {
  try {
    // 1. Delete all files from Cloudinary
    const files = await prisma.file.findMany();
    if (files.length > 0) {
      for (const file of files) {
        if (file.publicId) {
          await cloudinary.uploader.destroy(file.publicId, {
            resource_type: file.type === "VIDEO" ? "video" : file.type === "IMAGE" ? "image" : "raw"
          }).catch((err) => {
            console.error(`Failed to delete file ${file.publicId} from cloudinary:`, err);
          });
        }
      }
    }

    // 2. Perform Database wipe in transaction to respect relations and constraints
    await prisma.$transaction([
      prisma.cartItem.deleteMany(),
      prisma.cart.deleteMany(),
      prisma.orderItem.deleteMany(),
      prisma.payment.deleteMany(),
      prisma.order.deleteMany(),
      prisma.file.deleteMany(),
      prisma.review.deleteMany(),
      prisma.productEmbedding.deleteMany(),
      prisma.product.deleteMany(),
      prisma.category.deleteMany(),
      prisma.couponUsage.deleteMany(),
      prisma.coupon.deleteMany(),
      prisma.otp.deleteMany(),
      prisma.refreshToken.deleteMany(),
      prisma.address.deleteMany(),
      prisma.faqEmbedding.deleteMany(),
      prisma.faq.deleteMany(),
      // Delete users where isAdmin is false
      prisma.user.deleteMany({
        where: {
          isAdmin: false
        }
      })
    ]);

    return res.status(200).json({ success: true, message: "Successfully wiped all data and media files." });
  } catch (error) {
    console.error("Wipe all data error", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
