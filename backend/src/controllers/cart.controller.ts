import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { cartTotal } from "../utils/helper.js";
import { AuthRequest } from "../middlewares/auth.js";
import { orderEmailQueue } from "../queues/order-email.queue.js";
import { scheduleCartRecovery, cancelCartRecovery } from "../queues/cart.queue.js";
import redisService from "../services/redis.service.js";
import { redisKeys } from "../utils/redis.keys.js";

export const applyCoupon = async (req: AuthRequest, res: Response) => {
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



export const checkout = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId
  const { couponCode, addressId, paymentMethod } = req.body

  if (!addressId || !paymentMethod) {
    return res.status(400).json({
      success: false,
      message: "Address and Payment Method are required",
    })
  }

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    })
  }

  try {
    /* ----------------------------------
       1️⃣ READ CART (OUTSIDE TRANSACTION)
    ---------------------------------- */
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: { include: { product: true } },
      },
    })

    if (!cart || cart.items.length === 0) {
      throw new Error("CART_EMPTY")
    }

    const subTotal = cartTotal(cart.items)

    /* ----------------------------------
       2️⃣ COUPON VALIDATION (OUTSIDE TX)
    ---------------------------------- */
    let coupon: any = null
    let discount = 0

    if (couponCode) {
      coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
      })

      if (!coupon || !coupon.isActive || coupon.expiresAt < new Date()) {
        throw new Error("INVALID_COUPON")
      }

      if (subTotal < coupon.minCartValue) {
        throw new Error("MIN_CART_NOT_MET")
      }

      const usedByUser = await prisma.couponUsage.findUnique({
        where: {
          couponId_userId: {
            couponId: coupon.id,
            userId,
          },
        },
      })

      if (usedByUser) {
        throw new Error("COUPON_ALREADY_USED")
      }

      if (coupon.usageLimit) {
        const usedCount = await prisma.couponUsage.count({
          where: { couponId: coupon.id },
        })

        if (usedCount >= coupon.usageLimit) {
          throw new Error("COUPON_LIMIT_EXCEEDED")
        }
      }

      discount =
        coupon.discountType === "PERCENT"
          ? Math.floor((subTotal * coupon.discountValue) / 100)
          : coupon.discountValue

      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount)
      }
    }

    /* ----------------------------------
       3️⃣ FETCH ADMINS FOR NOTIFICATION
    ---------------------------------- */
    const admins = await prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: {
              isSystemRole: true
            }
          }
        }
      },
      select: { id: true },
    })

    /* ----------------------------------
       4️⃣ SHORT & FAST TRANSACTION
    ---------------------------------- */
    const order = await prisma.$transaction(async (tx) => {
      // 🔒 Lock cart
      const locked = await tx.cart.updateMany({
        where: {
          userId,
          locked: false,
        },
        data: {
          locked: true,
          lockedAt: new Date(),
        },
      })

      if (locked.count === 0) {
        throw new Error("CHECKOUT_IN_PROGRESS")
      }

      // 📦 Update stock (PARALLEL)
      const stockUpdates = await Promise.all(
        cart.items.map((item) =>
          tx.product.updateMany({
            where: {
              id: item.productId,
              itemLeft: { gte: item.quantity },
            },
            data: {
              itemLeft: { decrement: item.quantity },
            },
          })
        )
      )

      if (stockUpdates.some((u) => u.count === 0)) {
        throw new Error("OUT_OF_STOCK")
      }

      // 🧾 Create order
      const finalTotal = Math.max(subTotal - discount, 0);
      const order = await tx.order.create({
        data: {
          userId,
          addressId,
          subTotal,
          discountAmount: discount,
          total: finalTotal,
          couponId: coupon?.id,
          couponCode: coupon?.code,
          status: "PENDING",
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
          payment: {
            create: {
              amount: finalTotal,
              currency: 'INR',
              status: "PENDING",
            }
          }
        },
        include: {
          items: true
        }
      })

      // 🏷️ Mark coupon as used
      if (coupon) {
        await tx.couponUsage.create({
          data: {
            userId,
            couponId: coupon.id,
          },
        })
      }

      // 🧹 Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      })

      await cancelCartRecovery(cart.id)

      await tx.cart.update({
        where: { id: cart.id },
        data: {
          total: 0,
          locked: false,
          lockedAt: null,
        },
      })

      // 🔔 Create Notifications
      const notificationsData: any[] = [
        {
          title: "Order Placed Successfully",
          description: `Your order #${order.id.slice(0, 8).toUpperCase()} has been placed.`,
          receiverId: userId,
          channel: "IN_APP",
          type: "SUCCESS",
        }
      ]

      admins.forEach((admin) => {
        notificationsData.push({
          title: "New Order Received",
          description: `Order #${order.id.slice(0, 8).toUpperCase()} was placed.`,
          receiverId: admin.id,
          channel: "IN_APP",
          type: "INFO",
        })
      })

      if (notificationsData.length > 0) {
        await tx.notification.createMany({
          data: notificationsData,
        })
      }

      return order
    })

    const finalTotal = order.total
    const itemCount = order.items.reduce(
      (total, item) => total + item.quantity,
      0
    );

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } })

    if (user) {
      await orderEmailQueue.add('user-confirmation', {
        type: 'user-confirmation',
        orderId: order.id,
        recipientEmail: user.email,
        recipientName: user.name || "",
        total: Number(finalTotal),
        itemCount,
      });
    }

    // one email per admin (you already have `admins` fetched)
    const adminUsers = await prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: {
              name: "super_admin"
            }
          }
        },
        isActive: true,
        isDeleted: false
      },
      select: { email: true, name: true }
    });

    await Promise.all(
      adminUsers.map((admin) =>
        orderEmailQueue.add('admin-alert', {
          type: 'admin-alert',
          orderId: order.id,
          recipientEmail: admin.email,
          recipientName: admin.name || "Admin",
          total: Number(finalTotal),
          itemCount,
        })
      )
    );

    await redisService.delete(redisKeys.cart(userId));

    /* ----------------------------------
       4️⃣ RESPONSE
    ---------------------------------- */
    return res.status(200).json({
      success: true,
      message: "Order placed successfully",
      data: { orderId: order.id },
    })
  } catch (error: any) {
    console.error("Checkout error:", error.message)

    return res.status(400).json({
      success: false,
      message: error.message,
    })
  }
}


export const cartItems = async (req: AuthRequest, res: Response) => {
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

    if (cart.items.length > 0) {
      const hashValues: Record<string, string> = {};
      for (const item of cart.items) {
        hashValues[item.productId] = item.quantity.toString();
      }
      await redisService.setHashValues(redisKeys.cart(userId), hashValues);
    }

    return res
      .status(200)
      .json({ success: true, data: cart.items, totalAmount: cart.total });
  } catch (error) {
    console.error("cartItems error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const addIntoCart = async (req: AuthRequest, res: Response) => {
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
        : product.sellingPrice;

    // 2️⃣ Ensure cart exists
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    // 3️⃣ Atomic transaction (short & safe)
    const [cartItem] = await prisma.$transaction([
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

    await scheduleCartRecovery(userId, cart.id);

    await redisService.setHashValue(redisKeys.cart(userId), productId, cartItem.quantity);

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

export const decreaseFromCart = async (req: AuthRequest, res: Response) => {
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
        : cartItem.product.sellingPrice;

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
      await redisService.setHashValue(redisKeys.cart(userId), productId, cartItem.quantity - 1);
    } else {
      await prisma.$transaction([
        prisma.cartItem.delete({ where: { id: cartItem.id } }),
        prisma.cart.update({
          where: { id: cart.id },
          data: { total: { decrement: price } },
        }),
      ]);
      await redisService.deleteHashValue(redisKeys.cart(userId), productId);
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

export const deleteCartItem = async (req: AuthRequest, res: Response) => {
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
        : cartItem.product.sellingPrice;

    const totalToDeduct = price * cartItem.quantity;

    // 2️⃣ Atomic delete
    await prisma.$transaction([
      prisma.cartItem.delete({ where: { id: cartItem.id } }),
      prisma.cart.update({
        where: { id: cart.id },
        data: { total: { decrement: totalToDeduct } },
      }),
    ]);

    await redisService.deleteHashValue(redisKeys.cart(userId), productId);

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

export const getCartItems = async (req: AuthRequest, res: Response) => {
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
      return res.status(200).json({ success: true, data: { items: [], total: 0 } });
    }

    if (cart.items.length > 0) {
      const hashValues: Record<string, string> = {};
      for (const item of cart.items) {
        hashValues[item.productId] = item.quantity.toString();
      }
      await redisService.setHashValues(redisKeys.cart(userId), hashValues);
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

export const getAllCoupons = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const now = new Date();

    const availableCoupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        expiresAt: { gt: now },
        couponUsages: {
          none: { userId }
        }
      },
      include: {
        _count: {
          select: { couponUsages: true }
        }
      }
    });

    const validCoupons = availableCoupons
      .filter(c => c.usageLimit === null || c._count.couponUsages < c.usageLimit)
      .map(c => {
        const { _count, ...rest } = c;
        return rest;
      });

    return res.status(200).json({ success: true, data: validCoupons });
  } catch (error) {
    console.error("getAllCoupons error", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const clearCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
      prisma.cart.update({
        where: { id: cart.id },
        data: { total: 0 }
      })
    ]);

    await cancelCartRecovery(cart.id);

    await redisService.delete(redisKeys.cart(userId));

    return res.status(200).json({ success: true, message: "Cart cleared successfully" });
  } catch (error) {
    console.error("clearCart Error", error);
    return res.status(500).json({ success: false, message: "Internal server Error" });
  }
};
