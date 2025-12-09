import { Request, Response } from "express";
import z from "zod";
import { prisma } from "../config/prisma.js";
import { uploadToCloudinary } from "../utils/helper.js";

const productSchema = z.object({
    title:z.string(),
    description:z.string(),
    price:z.number(),
    category:z.string()
})
export const addProduct=async(req:Request,res:Response)=>{
    
    try {
        const parsed = productSchema.safeParse(req.body)
    if(!parsed.success){
        return res.status(400).json({success:false,message:parsed.error})
    }
     const {title,description,price,category} = parsed.data
     let uploadedFiles:any[]=[]
     if(req.files && Array.isArray(req.files)){
        for(const file of req.files){
            const result = await uploadToCloudinary(file)
            uploadedFiles?.push({
                url:result?.secure_url,
                publicId:result?.public_id,
                type:file.mimetype.startsWith("video") ? "VIDEO" : "IMAGE",
                filePurpose:"PRODUCT"
            })
        }
     }
      const product = await prisma.product.create({data:{title,description,price,category,files:{create:uploadedFiles}},include:{files:true}})
      return res.status(201).json({success:true,message:'Product Created successfully',product})
    } catch (error) {
        console.error("Add product controller error")
        return res.status(500).json({success:false,message:"Internal server error"})
    }
}