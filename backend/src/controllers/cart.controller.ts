import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { cartTotal } from "../utils/helper.js";

export const applyCoupon = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { code } = req.body;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorize" });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart Empty" });
    }
    if (cart.locked) {
      return res.status(400).json({
        success: false,
        message: "Cart is already locked for checkout",
      });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code },
      include: { couponUsages: true },
    });
    if (!coupon || !coupon.isActive) {
      return res
        .status(400)
        .json({ success: false, message: "coupon usage limit exceeded" });
    }

    if (coupon.expiresAt < new Date()) {
      return res
        .status(400)
        .json({ success: false, message: "Coupon has expired" });
    }
    if (coupon.usageLimit && coupon.couponUsages.length > coupon.usageLimit) {
      return res
        .status(400)
        .json({ success: false, message: "Usage limit exceeded" });
    }

    const usedByUser = await prisma.couponUsage.findUnique({
      where: {
        couponId_userId: {
          couponId: coupon.id,
          userId,
        },
      },
    });
    if (usedByUser) {
      return res
        .status(400)
        .json({ success: false, message: "This token already used by you" });
    }

    const subtotal = cartTotal(cart.items) || 0;
    if (subtotal < coupon.minCartValue) {
      return res
        .status(400)
        .json({ success: false, message: "You cart value is too low" });
    }

    let discount =
      coupon.discountType === "PERCENT"
        ? Math.floor((subtotal * coupon.discountValue) / 100)
        : coupon.discountValue;
    if (coupon.maxDiscount) {
      discount = Math.min(coupon.maxDiscount, discount);
    }

    return res.status(200).json({
      success: true,
      subtotal,
      discount,
      total: Math.max(subtotal - discount, 0),
      coupon: coupon.code,
    });
  } catch (error) {
    console.error("apply coupon error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const checkout = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { couponCode } = req.body;
  if (!userId) {
    return res.status(401).json({ success: false, messge: "Unauthorize" });
  }
  try {
    await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true } } },
      });
      if (!cart || cart.items.length === 0) {
        throw new Error("CART_IS_EMPTY");
      }

      const lockedCart = await tx.cart.updateMany({
        where: { userId, locked: false },
        data: { locked: true, lockedAt: new Date() },
      });
      if (lockedCart.count === 0) {
        throw new Error("Checkout already in progress");
      }

      let coupon = null;
      let discount = 0;
      const subTotal = cartTotal(cart.items) || 0;
      if (couponCode) {
        coupon = await tx.coupon.findUnique({ where: { code: couponCode } });

        if (!coupon || !coupon.isActive || coupon.expiresAt < new Date()) {
          throw new Error("Invalid coupon");
        }

        discount =
          coupon.discountType === "PERCENT"
            ? Math.floor((subTotal * coupon.discountValue) / 100)
            : coupon.discountValue;

        if (coupon.maxDiscount) {
          discount = Math.min(coupon.maxDiscount, discount);
        }
      }

      for (const item of cart.items) {
        if (item.product.itemLeft < item.quantity) {
          throw new Error("Out of Stock");
        }
      }

      const order = await tx.order.create({
        data: {
          userId,
          subTotal,
          discountAmount: discount,
          couponCode: coupon?.code,
          couponId: coupon?.id,
          total: subTotal - discount,
          items: {
            create: cart.items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
            })),
          },
        },
      });

      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { itemLeft: { decrement: item.quantity } },
        });
      }
      if (coupon) {
        await tx.couponUsage.create({
          data: { couponId: coupon.id, userId },
        });
      }
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({
        where: { id: cart.id },
        data: { total: 0, locked: false, lockedAt: null },
      });
    });
  } catch (error: any) {
    console.error("Error in checkout", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};




export const cartItems = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "UnAuthorize" });
    }
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!cart) {
      return res.status(200).json({ success: true, data: [], totalAmount: 0 });
    }

    return res
      .status(200)
      .json({ success: false, data: cart.items, totalAmount: cart.total });
  } catch (error) {
    console.error("cartItems error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const addIntoCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { productId } = req.params;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthoriza" });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.disabled) {
      return res
        .status(404)
        .json({ success: false, message: "Product not available" });
    }

    if (product.itemLeft <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Product out of stock" });
    }

    const priceToUse =
      product.isOfferActive && product.offerPrice
        ? product.offerPrice
        : product.price;

    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId, total: 0 } });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });
    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + 1,
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity: 1,
        },
      });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: { product: true },
    });

    const newTotal = cartItems.reduce((sum, item) => {
      const price =
        item.product.isOfferActive && item.product.offerPrice
          ? item.product.offerPrice
          : item.product.price;
      return sum + price;
    }, 0);

    await prisma.cart.update({
      where: { id: cart.id },
      data: { total: newTotal },
    });

    return res
      .status(200)
      .json({ success: true, message: "Item added into cart successfully" });
  } catch (error) {
    console.error("addInto cart error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server error" });
  }
};

export const decreaseFromCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorize" });
    }

    const { productId } = req.params;

    await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({ where: { userId } });
      if (!cart) {
        throw new Error("CART_NOT_FOUND");
      }

      const cartItem = await tx.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId,
          },
        },
        include: { product: true },
      });
      if (!cartItem) {
        throw new Error("ITEM_NOT_FOUND");
      }

      const price =
        cartItem.product.isOfferActive && cartItem.product.offerPrice
          ? cartItem.product.offerPrice
          : cartItem.product.price;
      if (cartItem.quantity > 1) {
        await tx.cartItem.update({
          where: { id: cartItem.id },
          data: {
            quantity: cartItem.quantity - 1,
          },
        });
        await tx.cart.update({
          where: { id: cart.id },
          data: { total: Math.max(0, cart.total - price) },
        });
      } else {
        await tx.cartItem.delete({ where: { id: cartItem.id } });
        await tx.cart.update({
          where: { id: cart.id },
          data: { total: Math.max(0, cart.total - price * cartItem.quantity) },
        });
      }
    });

    return res
      .status(200)
      .json({ success: true, message: "Cart item removed successfully" });
  } catch (error: any) {
    if (error.message === "CART_NOT_FOUND") {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }
    if (error.message === "ITEM_NOT_FOUND") {
      return res
        .status(404)
        .json({ success: false, message: "Item not in cart" });
    }
    console.error("removeFromCart error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const deleteCartItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { productId } = req.params;

    await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({ where: { userId: userId } });
      if (!cart) {
        throw new Error("CART_NOT_FOUND");
      }

      const cartItem = await tx.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId,
          },
        },
        include: { product: true },
      });
      if (!cartItem) {
        throw new Error("ITEM_NOT_FOUND");
      }

      await tx.cartItem.delete({ where: { id: cartItem.id } });
      const price =
        cartItem.product.isOfferActive && cartItem.product.offerPrice
          ? cartItem.product.offerPrice
          : cartItem.product.price;

      await tx.cart.update({
        where: { id: cart.id },
        data: { total: Math.max(0, cart.total - price * cartItem.quantity) },
      });
    });

    return res
      .status(200)
      .json({
        success: true,
        message: "This product deleted from your cart successfully",
      });
  } catch (error: any) {
    if (error.message === "CART_NOT_FOUND") {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }
    if (error.message === "ITEM_NOT_FOUND") {
      return res
        .status(404)
        .json({ success: false, message: "Item not in cart" });
    }
    console.error("deleteCart Item Error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const getCartItems = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "UnAuthorize" });
    }
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });
    if (!cart) {
      return res.status(200).json({ success: true, data: [] , total:0});
    }
    return res
      .status(200)
      .json({ success: true, data: { items: cart.items, total: cart.total } });
  } catch (error) {
    console.error("getCartItems Error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server Error" });
  }
};

export const getAllCoupons = async(req:Request,res:Response)=>{
  try {
    const coupons = await prisma.coupon.findMany({where:{isActive:true}})
    if(!coupons){
      return res.status(200).json({success:true,data:[]})
    }
  } catch (error) {
    console.error("getAllCoupons error",error)
    return res.status(500).json({success:false,message:"Internal server error"})
  }
}

