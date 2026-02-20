import { Request, Response } from "express";
import { includes, z } from "zod";
import { prisma } from "../config/prisma.js";
import { uploadToCloudinary } from "../utils/helper.js";
import { Category, FilePurpose, FileType } from "@prisma/client";
import { getRandomImagesFromFolder } from "../utils/localImageUploader.js";
import path from "path";


const productSchema = z.object({
  title: z.string(),
  description: z.string(),
  price: z.string().transform((val) => Number(val)),
  category: z.enum(["ELECTRONICS", "CLOTHES", "DAILY_USAGE"]),
  itemLeft: z.string().transform((val) => Number(val)),
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
    return res.status(201).json({
      success: true,
      message: "Product Created successfully",
      product,
    });
  } catch (error) {
    console.error("Add product controller error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const updateProductSchema = z
  .object({
    title: z.string(),
    description: z.string(),
    price: z.string().transform((val) => Number(val)),
    category: z.enum(["ELECTRONICS", "CLOTHES", "DAILY_USAGE"]),
    itemLeft: z.string().transform((val) => Number(val)),
  })
  .partial();
export const updateProduct = async (req: Request, res: Response) => {
  try {
    console.log("body in update product", req.body);
    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    const { title, description, price, category, itemLeft } = parsed.data;
    const { productId } = req.params;

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "No product found with provided id",
      });
    }

    const dataToBeUpdate = Object.fromEntries(
      Object.entries(parsed.data)?.filter(([_, value]) => value !== undefined)
    );

    const updateProduct = await prisma.product.update({
      where: { id: productId },
      data: dataToBeUpdate,
    });
    return res
      .status(200)
      .json({
        success: true,
        message: "product updated successfully",
        data: updateProduct,
      });
  } catch (error) {
    console.error("update product error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};


export const productSeeder = async (req: Request, res: Response) => {
  try {
    const categoryFolders = {
  ELECTRONICS: path.join(process.cwd(), "public/electronics"),
  CLOTHES: path.join(process.cwd(), "public/clothes"),
  DAILY_USAGE: path.join(process.cwd(), "public/daily_use"),
};

    const rand = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    const categories: Category[] = [
      "ELECTRONICS",
      "CLOTHES",
      "DAILY_USAGE",
    ];

    for (let i = 1; i <= 40; i++) {
      const category = categories[rand(0, categories.length - 1)];

      const product = await prisma.product.create({
        data: {
          title: `Sample ${category} Product ${i}`,
          description:
            "High quality product with durable material and modern design.",
          price: rand(300, 3000),
          offerPrice: rand(200, 2500),
          isOfferActive: Math.random() > 0.5,
          category,
          itemLeft: rand(10, 80),
          disabled: false,
        },
      });

      // 🔥 Pick random images from local folder
      const images = getRandomImagesFromFolder(
        categoryFolders[category],
        3
      );

      for (const img of images) {
        const uploaded = await uploadToCloudinary(img as any);

        await prisma.file.create({
          data: {
            type: FileType.IMAGE,
            url: uploaded.secure_url,
            publicId: uploaded.public_id,
            filePurpose: FilePurpose.PRODUCT_MEDIA,
            productId: product.id,
          },
        });
      }

      console.log(`✔ Product ${i}/40 with images added`);
    }

    return res.status(200).json({
      success: true,
      message: "Product seeding with images completed",
    });
  } catch (error) {
    console.error("productSeeder error", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const deleteAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.deleteMany();
    return res
      .status(200)
      .json({ success: true, message: "all products are deleted" });
  } catch (error) {
    console.error("getAllProducts Error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const category = req.query.category as Category | undefined;
    const minPrice = req.query.minPrice
      ? Number(req.query.minPrice)
      : undefined;
    const maxPrice = req.query.maxPrice
      ? Number(req.query.maxPrice)
      : undefined;

    const search = req.query.search as string | undefined;
    const skip = (page - 1) * limit;

    let where: any = {};
    if (category) {
      where.category = category;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = minPrice;
      if (maxPrice) where.price.lte = maxPrice;
    }

    if (search) {
      where.title = {
        contains: search,
        mode: "insensitive",
      };
    }
    const products = await prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { files: true,
        cartItems:userId ?{
          where:{
            cart:{
              userId
            }
          },
          select:{
            quantity:true
          }
        }:false
       },
    });

    const totalProducts = await prisma.product.count({ where });
    const formattedProducts = products?.map((item)=>({
      ...item,
      isInCart:item.cartItems.length > 0,
      cartQuantity:item.cartItems[0]?.quantity || 0,
      cartItems:undefined
    }))

    return res
      .status(200)
      .json({
        success: true,
        message: "all products are fetched",
        page,
        limit,
        totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
        data: formattedProducts,
      });
  } catch (error) {
    console.error("getAllProducts Error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const productDetails = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId
    const { productId } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { files: true,
        cartItems:userId ? {
          where:{
            cart:{
              userId
            }
          },
          select:{
            quantity:true
          }
        }:false
       },
    });
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "No product found for given id" });
    }

    const formattedProducts = {
      ...product,
      isInCart:product.cartItems.length > 0,
      cartQuantity:product.cartItems[0]?.quantity || 0,
      cartItems:undefined
    }
    return res.status(200).json({ success: true, data: formattedProducts });
  } catch (error) {
    console.error("products details error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};


export const submitProductReview = async(req:Request,res:Response)=>{
  try {
    const userId = req.user?.userId
    if(!userId){
      return res.status(401).json({success:false,message:"Unauthorized"})
    }
    const {productId} = req.params
    const {comment,rating} = req.body
    if(!rating || rating < 1 || rating > 5){
      return res.status(400).json({success:false,message:"Rating must be  between 1 to 5"})
    }

    const product = await prisma.product.findUnique({where:{id:productId}})
    if(!product){
      return res.status(404).json({success:false,message:"Product not found"})
    }

     const hasPurchased = await prisma.orderItem.findFirst({
      where:{productId,order:{userId,status:"DELIVERED"}}
    })

    if(!hasPurchased){
      return res.status(400).json({success:false,message:"You only review your purchased product"})
    }
    const existingReview = await prisma.review.findUnique({where:{productId_userId:{productId,userId}}})
    if(existingReview){
      return res.status(400).json({success:false,message:"You already reviewd this product"})
    }

    const result = await prisma.$transaction(async (tx)=>{
      const review = await tx.review.create({data:{
        productId,
        userId,
        rating,
        comment
      }})
      const stats = await tx.review.aggregate({where:{
        productId
      },
      _avg:{rating:true},
      _count:{rating:true}
      })
      await tx.product.update({where:{id:productId},data:{
        averageRating:stats._avg.rating ?? 0,
        totalReviews:stats._count.rating
      }})
      return review
    })

    return res.status(200).json({success:true,message:"You submitted you review successfully",data:result})
  } catch (error) {
    console.error("Error in Product Reviews")
    return res.status(500).json({success:false,message:"Internal Server Error"})
  }
}


