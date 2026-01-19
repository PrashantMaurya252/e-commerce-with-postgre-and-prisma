import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { cartTotal } from "../utils/helper.js";

export const applyCoupon = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { code } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    if (cart.locked) {
      return res.status(400).json({
        success: false,
        message: "Cart is locked for checkout",
      });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon || !coupon.isActive) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon",
      });
    }

    if (coupon.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Coupon expired",
      });
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
      return res.status(400).json({
        success: false,
        message: "Coupon already used by you",
      });
    }

    if (coupon.usageLimit) {
      const usedCount = await prisma.couponUsage.count({
        where: { couponId: coupon.id },
      });

      if (usedCount >= coupon.usageLimit) {
        return res.status(400).json({
          success: false,
          message: "Coupon usage limit exceeded",
        });
      }
    }

    const subTotal = cartTotal(cart.items);

    if (subTotal && subTotal < coupon.minCartValue) {
      return res.status(400).json({
        success: false,
        message: "Cart value too low for this coupon",
      });
    }

    let discount =
      coupon.discountType === "PERCENT"
        ? Math.floor((subTotal * coupon.discountValue) / 100)
        : coupon.discountValue;

    if (coupon.maxDiscount) {
      discount = Math.min(discount, coupon.maxDiscount);
    }

    return res.status(200).json({
      success: true,
      data: {
        subTotal,
        discount,
        total: Math.max(subTotal - discount, 0),
        coupon: coupon.code,
      },
    });
  } catch (error) {
    console.error("Apply coupon error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const checkout = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { couponCode, paymentIntent } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: {
          items: { include: { product: true } },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new Error("CART_EMPTY");
      }

      const lock = await tx.cart.updateMany({
        where: {
          userId,
          OR: [
            { locked: false },
            {
              locked: true,
              lockedAt: { lt: new Date(Date.now() - 10 * 60 * 1000) },
            },
          ],
        },
        data: {
          locked: true,
          lockedAt: new Date(),
        },
      });

      if (lock.count === 0) {
        throw new Error("CHECKOUT_IN_PROGRESS");
      }

      const subTotal = cartTotal(cart.items);
      let discount = 0;
      let coupon = null;

      if (couponCode) {
        coupon = await tx.coupon.findUnique({
          where: { code: couponCode },
        });

        if (!coupon || !coupon.isActive || coupon.expiresAt < new Date()) {
          throw new Error("INVALID_COUPON");
        }

        if (subTotal < coupon.minCartValue) {
          throw new Error("MIN_CART_NOT_MET");
        }

        const usedByUser = await tx.couponUsage.findUnique({
          where: {
            couponId_userId: {
              couponId: coupon.id,
              userId,
            },
          },
        });

        if (usedByUser) {
          throw new Error("COUPON_ALREADY_USED");
        }

        if (coupon.usageLimit) {
          const usedCount = await tx.couponUsage.count({
            where: { couponId: coupon.id },
          });

          if (usedCount >= coupon.usageLimit) {
            throw new Error("COUPON_LIMIT_EXCEEDED");
          }
        }

        discount =
          coupon.discountType === "PERCENT"
            ? Math.floor((subTotal * coupon.discountValue) / 100)
            : coupon.discountValue;

        if (coupon.maxDiscount) {
          discount = Math.min(discount, coupon.maxDiscount);
        }
      }

      for (const item of cart.items) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            itemLeft: { gte: item.quantity },
          },
          data: {
            itemLeft: { decrement: item.quantity },
          },
        });

        if (updated.count === 0) {
          throw new Error("OUT_OF_STOCK");
        }
      }

      const order = await tx.order.create({
        data: {
          userId,
          subTotal,
          discountAmount: discount,
          total: Math.max(subTotal - discount, 0),
          couponId: coupon?.id,
          couponCode: coupon?.code,
          status: "PENDING",
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
        },
      });

      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: order.total,
          currency: "INR",
          status: "PENDING",
          stripePaymentIntentId: paymentIntent.id,
        },
      });

      if (coupon) {
        await tx.couponUsage.create({
          data: {
            userId,
            couponId: coupon.id,
          },
        });
      }

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      await tx.cart.update({
        where: { id: cart.id },
        data: {
          total: 0,
          locked: false,
          lockedAt: null,
        },
      });

      return order;
    });

    return res.status(200).json({
      success: true,
      message: "Order placed successfully",
      orderId: result.id,
    });
  } catch (error: any) {
    console.error("Checkout error:", error.message);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
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
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // 1️⃣ Read product (outside transaction)
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

    const price =
      product.isOfferActive && product.offerPrice
        ? product.offerPrice
        : product.price;

    // 2️⃣ Ensure cart exists
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    // 3️⃣ Atomic transaction (short & safe)
    await prisma.$transaction([
      prisma.cartItem.upsert({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId,
          },
        },
        update: {
          quantity: { increment: 1 },
        },
        create: {
          cartId: cart.id,
          productId,
          quantity: 1,
        },
      }),

      prisma.cart.update({
        where: { id: cart.id },
        data: {
          total: { increment: price },
        },
      }),
    ]);

    return res
      .status(200)
      .json({ success: true, message: "Item added to cart" });
  } catch (error) {
    console.error("addIntoCart error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const decreaseFromCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { productId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // 1️⃣ Read cart + item
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
      include: { product: true },
    });

    if (!cartItem) {
      return res
        .status(404)
        .json({ success: false, message: "Item not in cart" });
    }

    const price =
      cartItem.product.isOfferActive && cartItem.product.offerPrice
        ? cartItem.product.offerPrice
        : cartItem.product.price;

    // 2️⃣ Decide operation
    if (cartItem.quantity > 1) {
      await prisma.$transaction([
        prisma.cartItem.update({
          where: { id: cartItem.id },
          data: { quantity: { decrement: 1 } },
        }),
        prisma.cart.update({
          where: { id: cart.id },
          data: { total: { decrement: price } },
        }),
      ]);
    } else {
      await prisma.$transaction([
        prisma.cartItem.delete({ where: { id: cartItem.id } }),
        prisma.cart.update({
          where: { id: cart.id },
          data: { total: { decrement: price } },
        }),
      ]);
    }

    return res
      .status(200)
      .json({ success: true, message: "Cart updated successfully" });
  } catch (error) {
    console.error("decreaseFromCart error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const deleteCartItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { productId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // 1️⃣ Read cart + item
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
      include: { product: true },
    });

    if (!cartItem) {
      return res
        .status(404)
        .json({ success: false, message: "Item not in cart" });
    }

    const price =
      cartItem.product.isOfferActive && cartItem.product.offerPrice
        ? cartItem.product.offerPrice
        : cartItem.product.price;

    const totalToDeduct = price * cartItem.quantity;

    // 2️⃣ Atomic delete
    await prisma.$transaction([
      prisma.cartItem.delete({ where: { id: cartItem.id } }),
      prisma.cart.update({
        where: { id: cart.id },
        data: { total: { decrement: totalToDeduct } },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Item removed from cart successfully",
    });
  } catch (error) {
    console.error("deleteCartItem error", error);
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
          include: {
            product: {
              include: {
                files: true,
              },
            },
          },
        },
      },
    });
    if (!cart) {
      return res.status(200).json({ success: true, data: [], total: 0 });
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

export const getAllCoupons = async (req: Request, res: Response) => {
  try {
    const coupons = await prisma.coupon.findMany({ where: { isActive: true } });
    if (!coupons) {
      return res.status(200).json({ success: true, data: [] });
    }

    return res.status(200).json({ success: true, data: coupons });
  } catch (error) {
    console.error("getAllCoupons error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
