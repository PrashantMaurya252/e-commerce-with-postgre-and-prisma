import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { uploadToCloudinary } from "../utils/helper.js";
import { FilePurpose, FileType } from "@prisma/client";
import { getRandomImagesFromFolder } from "../utils/localImageUploader.js";
// import redis from '../config/redis.js'
import path from "path";
import { AuthRequest } from "../middlewares/auth.js";
import { generateEmbedding, semanticProductSearch } from "../utils/gemeni-helper.js";




const productSchema = z
  .object({
    title: z.string(),
    description: z.string(),
    sellingPrice: z.string().transform((val) => Number(val)),
    costPrice: z.string().transform((val) => Number(val)),
    offerPrice: z.string().transform((val) => Number(val)),
    brand: z.string(),
    categoryId: z.string(),
    itemLeft: z.string().transform((val) => Number(val)),
    isOfferActive: z
      .union([z.boolean(), z.string().transform((val) => val === "true")])
      .optional(),
  })
  .refine((data) => data.costPrice < data.sellingPrice, {
    message: "costPrice must be less than sellingPrice",
    path: ["costPrice"],
  })
  .refine((data) => data.costPrice < data.offerPrice, {
    message: "costPrice must be less than offerPrice",
    path: ["costPrice"],
  })
  .refine((data) => data.offerPrice <= data.sellingPrice, {
    message: "offerPrice must be less than or equal to sellingPrice",
    path: ["offerPrice"],
  });

export const addProduct = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error });
    }
    const { title, description, sellingPrice, costPrice, offerPrice, brand, categoryId, itemLeft, isOfferActive } = parsed.data;
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
    const embedding = await generateEmbedding(`${title}\n${description}`);

    const product = await prisma.product.create({
      data: {
        title,
        description,
        sellingPrice,
        costPrice,
        offerPrice,
        brand,
        isOfferActive: isOfferActive ?? false,
        categoryId,
        itemLeft,
        files: { create: uploadedFiles },
      },
      include: { files: true },
    });

    await prisma.$executeRaw`
      INSERT INTO product_embeddings
      (id, product_id, embedding)
      VALUES (
        ${crypto.randomUUID()},
        ${product.id},
        ${JSON.stringify(embedding)}::vector
      )
    `;
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
    sellingPrice: z.string().transform((val) => Number(val)),
    costPrice: z.string().transform((val) => Number(val)),
    offerPrice: z.string().transform((val) => Number(val)),
    brand: z.string(),
    categoryId: z.string(),
    itemLeft: z.string().transform((val) => Number(val)),
    isOfferActive: z
      .union([z.boolean(), z.string().transform((val) => val === "true")])
      .optional(),
  })
  .partial()
  .superRefine((data, ctx) => {
    // Only validate when at least two of the three prices are provided
    const { sellingPrice, costPrice, offerPrice } = data;
    if (costPrice !== undefined && sellingPrice !== undefined && costPrice >= sellingPrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "costPrice must be less than sellingPrice",
        path: ["costPrice"],
      });
    }
    if (costPrice !== undefined && offerPrice !== undefined && costPrice >= offerPrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "costPrice must be less than offerPrice",
        path: ["costPrice"],
      });
    }
    if (offerPrice !== undefined && sellingPrice !== undefined && offerPrice > sellingPrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "offerPrice must be less than or equal to sellingPrice",
        path: ["offerPrice"],
      });
    }
  });

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    console.log("body in update product", req.body);
    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    const { productId } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "No product found with provided id",
      });
    }

    // If only one price is provided, validate against the existing DB values
    const resolvedSelling = parsed.data.sellingPrice ?? product.sellingPrice;
    const resolvedCost = parsed.data.costPrice ?? product.costPrice;
    const resolvedOffer = parsed.data.offerPrice ?? product.offerPrice;

    if (resolvedCost >= resolvedSelling) {
      return res.status(400).json({
        success: false,
        message: "costPrice must be less than sellingPrice",
      });
    }
    if (resolvedCost >= resolvedOffer) {
      return res.status(400).json({
        success: false,
        message: "costPrice must be less than offerPrice",
      });
    }
    if (resolvedOffer > resolvedSelling) {
      return res.status(400).json({
        success: false,
        message: "offerPrice must be less than or equal to sellingPrice",
      });
    }

    const dataToBeUpdate = Object.fromEntries(
      Object.entries(parsed.data)?.filter(([_, value]) => value !== undefined)
    );

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: dataToBeUpdate,
    });
    return res.status(200).json({
      success: true,
      message: "product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("update product error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};


export const productSeeder = async (req: AuthRequest, res: Response) => {
  try {
    const categoryFolders = {
  ELECTRONICS: path.join(process.cwd(), "public/electronics"),
  CLOTHES: path.join(process.cwd(), "public/clothes"),
  DAILY_USAGE: path.join(process.cwd(), "public/daily_use"),
};

    const rand = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    const defaultCategoryNames = [
      "ELECTRONICS",
      "CLOTHES",
      "DAILY_USAGE",
    ];
    
    const dbCategories = [];
    for (const name of defaultCategoryNames) {
      let cat = await prisma.category.findUnique({ where: { name } });
      if (!cat) {
        cat = await prisma.category.create({ data: { name, label: name } });
      }
      dbCategories.push(cat);
    }

    for (let i = 1; i <= 40; i++) {
      const categoryObj = dbCategories[rand(0, dbCategories.length - 1)];
      const categoryName = categoryObj.name as keyof typeof categoryFolders;

      const selling = rand(300, 3000);
      const cost = rand(100, selling - 1);
      const offer = rand(cost + 1, selling);
      const product = await prisma.product.create({
        data: {
          title: `Sample ${categoryName} Product ${i}`,
          description:
            "High quality product with durable material and modern design.",
          sellingPrice: selling,
          costPrice: cost,
          offerPrice: offer,
          brand: categoryName,
          isOfferActive: Math.random() > 0.5,
          categoryId: categoryObj.id,
          itemLeft: rand(10, 80),
          disabled: false,
        },
      });

      // 🔥 Pick random images from local folder
      const images = getRandomImagesFromFolder(
        categoryFolders[categoryName],
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

export const deleteAllProducts = async (req: AuthRequest, res: Response) => {
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

export const getAllProducts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const categoryId = req.query.category as string | undefined;
    const minPrice = req.query.minPrice
      ? Number(req.query.minPrice)
      : undefined;
    const maxPrice = req.query.maxPrice
      ? Number(req.query.maxPrice)
      : undefined;

    const search = req.query.search as string | undefined;
    const skip = (page - 1) * limit;

    const cacheKey = `products:page=${page}:limit=${limit}:cat=${categoryId || "all"}:minPrice=${minPrice || "none"}:maxPrice=${maxPrice || "none"}:search=${search || "none"}`

    // let responseData
    // const cached = await redis.get(cacheKey)
    let where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
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
        }:false,
        wishlistItem: userId ? {
          where: {
            wishlist: {
              userId
            }
          },
          select: {
            id: true
          }
        } : false
       },
    });

    const totalProducts = await prisma.product.count({ where });
    const formattedProducts = products?.map((item)=>({
      ...item,
      isInCart:item.cartItems.length > 0,
      cartQuantity:item.cartItems[0]?.quantity || 0,
      cartItems:undefined,
      isInWishlist: item.wishlistItem ? item.wishlistItem.length > 0 : false,
      wishlistItem: undefined
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

// export const getAllProducts = async (req: AuthRequest, res: Response) => {
//   try {
//     const userId = req.user?.userId
//     const page = Number(req.query.page) || 1;
//     const limit = Number(req.query.limit) || 10;

//     const category = req.query.category as Category | undefined;
//     const minPrice = req.query.minPrice
//       ? Number(req.query.minPrice)
//       : undefined;
//     const maxPrice = req.query.maxPrice
//       ? Number(req.query.maxPrice)
//       : undefined;

//     const search = req.query.search as string | undefined;
//     const skip = (page - 1) * limit;

//     const cacheKey = `products:page=${page}:limit=${limit}:cat=${category || "all"}:minPrice=${minPrice || "none"}:maxPrice=${maxPrice || "none"}:search=${search || "none"}`

//     let responseData
//     const cached = await redis.get(cacheKey)
//     // let where: any = {};

//     if(cached){
//       responseData = JSON.parse(cached)
//     }else{
//       let where: any = {};
//       if(category) where.category = category
//       if(minPrice || maxPrice){
//         where.price = {}
//         if(minPrice) where.price.get = minPrice
//         if(maxPrice) where.price.lte = maxPrice
//       }

//       if(search){
//         where.title={
//           contains:search,
//           mode:"insensitive"
//         }
//       }

//       const products = await prisma.product.findMany({
//         where,
//         skip,
//         take:limit,
//         orderBy:{createdAt:"desc"},
//         include:{files:true}
//       })

//       const totalProducts = await prisma.product.count({where})

//       responseData ={
//         success:true,
//         message:"all products are fetched",
//         page,
//         limit,
//         totalProducts,
//         totalPages:Math.ceil(totalProducts/limit),
//         data:products
//       };

//       await redis.set(cacheKey,JSON.stringify(responseData),"EX",300)
//     }

//     if(userId){
//       const cartItems = await prisma.cartItem.findMany({
//         where:{
//           cart:{userId}
//         },
//         select:{
//           productId:true,
//           quantity:true
//         }
//       })

//       const cartMap = new Map(cartItems.map((item)=>[item.productId,item.quantity]));
//       responseData.data = responseData.data.map((product:any)=>({
//         ...product,
//         isInCart:cartMap.has(product.id),
//         cartQuantity:cartMap.get(product.id) || 0,
//       }))
//     }else{
//       responseData.data = responseData.data.map((product:any)=>({
//         ...product,
//         isInCart:false,
//         cartQuantity:0
//       }))
//     }

//     return res.status(200).json(responseData)
    
    

    
//   } catch (error) {
//     console.error("getAllProducts Error", error);
//     return res
//       .status(500)
//       .json({ success: false, message: "Internal Server Error" });
//   }
// };

export const productDetails = async (req: AuthRequest, res: Response) => {
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
        }:false,
        wishlistItem: userId ? {
          where: {
            wishlist: {
              userId
            }
          },
          select: {
            id: true
          }
        } : false
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
      cartItems:undefined,
      isInWishlist: product.wishlistItem ? product.wishlistItem.length > 0 : false,
      wishlistItem: undefined
    }
    return res.status(200).json({ success: true, data: formattedProducts });
  } catch (error) {
    console.error("products details error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};


export const submitProductReview = async(req:AuthRequest,res:Response)=>{
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

export const productSearch=async(req:Request,res:Response)=>{
try {
  const {query} = req.body
  if(!query){
    return res.status(404).json({success:false,message:"Query is required"})
  }
  const products = await semanticProductSearch(query)
  return res.status(200).json({success:true,message:"Product Search",products})
} catch (error:any) {
  console.log("Product Search Error",error)
  return res.status(500).json({success:false,message:"Internal Server Error"})
}
}

export const updateProductReview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { productId } = req.params;
    const { comment, rating } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 to 5" });
    }

    const existingReview = await prisma.review.findUnique({ where: { productId_userId: { productId, userId } } });
    if (!existingReview) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const review = await tx.review.update({
        where: { productId_userId: { productId, userId } },
        data: { rating, comment },
      });
      const stats = await tx.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { rating: true },
      });
      await tx.product.update({
        where: { id: productId },
        data: {
          averageRating: stats._avg.rating ?? 0,
          totalReviews: stats._count.rating,
        },
      });
      return review;
    });

    return res.status(200).json({ success: true, message: "Review updated successfully", data: result });
  } catch (error) {
    console.error("Error updating review", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
