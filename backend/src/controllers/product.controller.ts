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

// export const productSeeder = async (req: Request, res: Response) => {
//   try {
//     const rand = (min: number, max: number) =>
//       Math.floor(Math.random() * (max - min + 1)) + min;

//     // Sample data
//     const productNames = [
//       "Wireless Bluetooth Speaker",
//       "Smart LED Bulb",
//       "USB-C Fast Charger",
//       "Laptop Cooling Pad",
//       "Portable Power Bank",
//       "Noise Cancelling Earphones",
//       "Smartwatch Fitness Tracker",
//       "Wireless Keyboard",
//       "Gaming Mouse",
//       "HD Webcam",
//       "Men Cotton T-Shirt",
//       "Casual Men Shirt",
//       "Women Stylish Top",
//       "Women Elegant Kurti",
//       "Sports Running Shoes",
//       "Premium Hoodie",
//       "Daily Use Steel Bottle",
//       "Lunch Box Set",
//       "Electric Kettle",
//       "Table Lamp",
//     ];

//     const descriptions = [
//       "This product is crafted with premium-quality materials, ensuring durability, reliability, and long-term performance. Its user-friendly design makes it an excellent choice for everyday use. Whether you're upgrading your essentials or adding something new to your setup, this product delivers a great balance of convenience, style, and functionality, making it suitable for a wide range of users.",

//       "Designed to offer superior performance, this product combines modern engineering with practical features that enhance your daily routine. Its sturdy build and thoughtful craftsmanship provide efficiency and comfort. Ideal for both casual and professional use, it promises consistent results and long-lasting value, making it a dependable addition to your everyday lifestyle.",

//       "A perfect blend of design and functionality, this product is built to handle regular use without compromising performance. It delivers smooth operation, dependable results, and a premium feel. Whether you're using it at home, work, or on the go, its long-lasting build quality and thoughtful design ensure a satisfying experience every time.",

//       "This product focuses on giving users a seamless experience by combining smart design with reliable performance. Built from durable materials, it stands strong against wear and tear, making it ideal for everyday use. Its practical features and stylish aesthetic offer excellent value, making it a useful and trustworthy choice for many different applications.",

//       "Offering exceptional value and dependable performance, this product is ideal for users looking for quality and convenience. The design prioritizes comfort, ease of use, and long-lasting durability. Whether used for personal needs or professional tasks, it consistently delivers a smooth and efficient experience, making it a versatile and worthwhile addition to your daily essentials.",
//     ];

//     const categories: Category[] = ["ELECTRONICS", "CLOTHES", "DAILY_USAGE"];

//     for (let i = 1; i <= 40; i++) {
//       const name = productNames[rand(0, productNames.length - 1)];

//       await prisma.product.create({
//         data: {
//           title: `${name} `,
//           description: descriptions[rand(0, descriptions.length - 1)],
//           price: rand(300, 3000),
//           offerPrice: rand(200, 2500),
//           isOfferActive: Math.random() > 0.5,
//           category: categories[rand(0, categories.length - 1)],
//           itemLeft: rand(10, 80),
//           disabled: false,
//         },
//       });

//       console.log(`✔ Product ${i}/40 added`);
//     }

//     return res
//       .status(200)
//       .json({ success: true, message: "Product seeding completed" });
//   } catch (error) {
//     console.error("productSeeder error", error);
//     return res
//       .status(500)
//       .json({ success: false, message: "Internal Server Error" });
//   }
// };



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
      include: { files: true },
    });

    const totalProducts = await prisma.product.count({ where });

    return res
      .status(200)
      .json({
        success: true,
        message: "all products are fetched",
        page,
        limit,
        totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
        data: products,
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
    const { productId } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { files: true },
    });
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "No product found for given id" });
    }

    return res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error("products details error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};


