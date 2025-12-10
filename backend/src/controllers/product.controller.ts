import { Request, Response } from "express";
import z from "zod";
import { prisma } from "../config/prisma.js";
import { uploadToCloudinary } from "../utils/helper.js";

const productSchema = z.object({
  title: z.string(),
  description: z.string(),
  price: z.string().transform((val)=>Number(val)),
  category: z.enum(["ELECTRONICS", "CLOTHES", "DAILY_USAGE"]),
  itemLeft: z.string().transform((val)=>Number(val)),
});
export const addProduct = async (req: Request, res: Response) => {
  try {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error });
    }
    const { title, description, price, category, itemLeft } = parsed.data;
    let uploadedFiles: any[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file);
        uploadedFiles?.push({
          url: result?.secure_url,
          publicId: result?.public_id,
          type: file.mimetype.startsWith("video") ? "VIDEO" : "IMAGE",
          filePurpose: "PRODUCT_MEDIA",
        });
      }
    }
    const product = await prisma.product.create({
      data: {
        title,
        description,
        price,
        category,
        itemLeft,
        files: { create: uploadedFiles },
      },
      include: { files: true },
    });
    return res
      .status(201)
      .json({
        success: true,
        message: "Product Created successfully",
        product,
      });
  } catch (error) {
    console.error("Add product controller error",error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};


const updateProductSchema = z.object({
    title: z.string(),
  description: z.string(),
  price: z.string().transform((val)=>Number(val)),
  category: z.enum(["ELECTRONICS", "CLOTHES", "DAILY_USAGE"]),
  itemLeft: z.string().transform((val)=>Number(val)),
}).partial()
export const updateProduct = async(req:Request,res:Response)=>{
    try {
        const parsed = updateProductSchema.safeParse(req.body)
        if(!parsed.success){
            return res.status(400).json({success:false,message:parsed.error})
        }

        const {title,description,price,category,itemLeft} = parsed.data
        const {productId} = req.params

        const product = await prisma.product.findUnique({where:{
            id:productId
        }})

        if(!product){
            return res.status(404).json({
                success:false,message:"No product found with provided id"
            })
        }

        const dataToBeUpdate = Object.fromEntries(Object.entries(parsed.data)?.filter(([_,value])=>value !== undefined))

        const updateProduct = await prisma.product.update({where:{id:productId},data:dataToBeUpdate})
    } catch (error) {
        console.error("update product error",error)
        return res.status(500).json({success:false,message:"Internal Server Error"})
    }
}
