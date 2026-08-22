import { Request, Response } from "express";
import z from "zod";
import { prisma } from "../config/prisma.js";
import { v2 as cloudinary } from "cloudinary";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { AuthRequest } from "../middlewares/auth.js";
import { ApiError, ApiResponse, asyncHandler } from "../utils/responseHandler.js";
const couponSchema = z.object({
    code: z.string().trim().toUpperCase(),
    discountType: z.enum(["PERCENT", "FLAT"]),
    discountValue: z.number().min(0),
    usageLimit: z.number().min(1).optional(),
    maxDiscount: z.number().min(1).optional(),
    minCartValue: z.number().min(1),
    expiresAt: z.coerce.date(),
    isActive: z.boolean().optional()
})
export const createCoupon = async (req: Request, res: Response) => {
    try {
        const parsed = couponSchema.safeParse(req.body)
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: parsed.error.message
            })
        }

        const { code, discountType, discountValue, usageLimit, maxDiscount, minCartValue, expiresAt, isActive } = parsed.data
        const couponExist = await prisma.coupon.findUnique({
            where: { code }
        })
        if (couponExist) {
            return res.status(400).json({ success: false, message: "Coupon already exist with same code" })
        }
        if (discountType === "PERCENT" && discountValue >= 100) {
            return res.status(400).json({ success: false, message: "This could make price 0" })
        }

        if (discountType === "FLAT" && discountValue >= minCartValue) {
            return res.status(400).json({ success: false, message: "Discount value should be less than minimum cart value" })
        }

        const newCoupon = await prisma.coupon.create({
            data: parsed.data
        })
        return res.status(201).json({ success: true, message: `New Coupon created with code ${newCoupon.code}` })
    } catch (error) {
        console.error("create coupon error", error)
        return res.status(500).json({ success: false, message: "Internal Server Error" })
    }
}

const updateCouponSchema = z.object({
    code: z.string().trim().toUpperCase(),
    discountType: z.enum(["PERCENT", "FLAT"]),
    discountValue: z.number().min(0),
    usageLimit: z.number().min(1).optional(),
    maxDiscount: z.number().min(1).optional(),
    minCartValue: z.number().min(1),
    expiresAt: z.coerce.date(),
    isActive: z.boolean()
}).partial()

export const updateCoupon = async (req: Request, res: Response) => {
    try {
        const { couponId } = req.params
        const coupon = await prisma.coupon.findUnique({ where: { id: couponId } })
        if (!coupon) {
            return res.status(404).json({
                success: false, message: "Coupon not exist"
            })
        }

        const parsed = updateCouponSchema.safeParse(req.body)
        if (!parsed.success) {
            return res.status(400).json({ success: false, message: parsed.error.message })
        }

        const { code, discountType, discountValue, usageLimit, maxDiscount, minCartValue, expiresAt, isActive } = parsed.data

        if (code) {
            const codeExist = await prisma.coupon.findUnique({ where: { code } })
            if (codeExist && codeExist.id !== couponId) {
                return res.status(400).json({ success: false, message: "Code already exist" })
            }
        }


        if (discountType === "PERCENT" && discountValue && discountValue >= 100) {
            return res.status(400).json({ success: false, message: "This could make price 0" })
        }

        if (discountType === "FLAT" && discountValue && minCartValue && discountValue >= minCartValue) {
            return res.status(400).json({ success: false, message: "Discount value should be less than minimum cart value" })
        }

        const dataTobeUpdate = Object.fromEntries(Object.entries(parsed.data).filter(([_, value]) => value !== undefined))
        const updatedCoupon = await prisma.coupon.update({
            where: {
                id: couponId
            },
            data: dataTobeUpdate
        })

        return res.status(200).json({ success: true, message: "Coupon Updated Successfully" })
    } catch (error) {
        console.error("Update coupon error", error)
        return res.status(500).json({ success: false, message: "Internal Server Error" })
    }
}

export const deleteCoupon = async (req: Request, res: Response) => {
    try {
        const { couponId } = req.params
        const coupon = await prisma.coupon.findUnique({ where: { id: couponId } })
        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not exist" })
        }
        await prisma.coupon.update({ where: { id: couponId }, data: { isActive: false } })
        return res.status(200).json({ success: true, message: "Coupon delete successfully" })
    } catch (error) {
        console.error("Delete Coupon Error", error)
        return res.status(500).json({ success: false, message: "Internal Server Errror" })
    }
}


export const getAllCoupon = async (req: Request, res: Response) => {
    try {
        const coupons = await prisma.coupon.findMany()
        return res.status(200).json({ success: true, data: coupons || [] })
    } catch (error) {
        console.error("get all coupons error", error)
        return res.status(500).json({ success: false, message: "Internal Server Error" })
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

export const getAllOrdersForAdmin = async (req: Request, res: Response) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const status = req.query.status as OrderStatus | undefined;
        const skip = (page - 1) * limit;

        let where: any = {};
        if (status) {
            where.status = status;
        }

        const orders = await prisma.order.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { name: true, email: true } },
                items: { include: { product: true } },
                address: true,
                payment: true,
            }
        });

        const totalOrders = await prisma.order.count({ where });

        return res.status(200).json({
            success: true,
            message: "Orders fetched successfully",
            page,
            limit,
            totalOrders,
            totalPages: Math.ceil(totalOrders / limit),
            data: orders,
        });
    } catch (error) {
        console.error("Get all orders error", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const updateOrderSchema = z.object({
    status: z.nativeEnum(OrderStatus)
});

export const updateOrderAdmin = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const parsed = updateOrderSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({ success: false, message: parsed.error });
        }

        const { status } = parsed.data;

        const existingOrder = await prisma.order.findUnique({ where: { id: orderId } });
        if (!existingOrder) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { status },
        });

        return res.status(200).json({
            success: true,
            message: "Order updated successfully",
            data: updatedOrder,
        });
    } catch (error) {
        console.error("Update order admin error", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const getAdminOrderById = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: { select: { name: true, email: true } },
                items: { include: { product: { include: { files: true } } } },
                address: true,
                payment: true,
            }
        });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Order fetched successfully",
            data: order,
        });
    } catch (error) {
        console.error("Get admin order by id error", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const updatePaymentSchema = z.object({
    status: z.nativeEnum(PaymentStatus)
});

export const updatePaymentStatusAdmin = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const parsed = updatePaymentSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({ success: false, message: parsed.error });
        }

        const { status } = parsed.data;

        const existingPayment = await prisma.payment.findUnique({ where: { orderId } });
        if (!existingPayment) {
            return res.status(404).json({ success: false, message: "Payment not found for this order" });
        }

        const updatedPayment = await prisma.payment.update({
            where: { orderId },
            data: { status },
        });

        return res.status(200).json({
            success: true,
            message: "Payment status updated successfully",
            data: updatedPayment,
        });
    } catch (error) {
        console.error("Update payment status admin error", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const totalOrders = await prisma.order.count();
        const totalProducts = await prisma.product.count();

        const categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });

        // Monthly orders (raw query to group by month for postgres)
        const monthlyOrders = await prisma.$queryRaw`
            SELECT 
                DATE_TRUNC('month', "createdAt") as month, 
                COUNT(id)::int as count 
            FROM "Order" 
            GROUP BY DATE_TRUNC('month', "createdAt") 
            ORDER BY month ASC;
        `;

        return res.status(200).json({
            success: true,
            data: {
                totalOrders,
                totalProducts,
                categories,
                monthlyOrders
            }
        });
    } catch (error) {
        console.error("getDashboardStats error", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const getAdminUsers = async (req: Request, res: Response) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const users = await prisma.user.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { orders: true }
                }
            }
        });

        const totalUsers = await prisma.user.count();

        return res.status(200).json({
            success: true,
            page,
            limit,
            totalUsers,
            totalPages: Math.ceil(totalUsers / limit),
            data: users
        });
    } catch (error) {
        console.error("getAdminUsers error", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const toggleUserStatus = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body; // boolean

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ success: false, message: "isActive boolean is required" });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: { isActive }
        });

        return res.status(200).json({
            success: true,
            message: `User has been ${isActive ? 'activated' : 'deactivated'}`,
            data: user
        });
    } catch (error) {
        console.error("toggleUserStatus error", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const getAdminProductsWithReviews = async (req: Request, res: Response) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const products = await prisma.product.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                files: true,
                reviews: {
                    include: { user: { select: { id: true, name: true, email: true, avatar: true } } }
                },
                _count: {
                    select: { orderItems: true }
                }
            }
        });

        const totalProducts = await prisma.product.count();

        return res.status(200).json({
            success: true,
            page,
            limit,
            totalProducts,
            totalPages: Math.ceil(totalProducts / limit),
            data: products
        });
    } catch (error) {
        console.error("getAdminProductsWithReviews error", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const deleteReviewAdmin = async (req: Request, res: Response) => {
    try {
        const { reviewId } = req.params;

        const existingReview = await prisma.review.findUnique({ where: { id: reviewId } });
        if (!existingReview) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        await prisma.$transaction(async (tx) => {
            // Delete review
            await tx.review.delete({ where: { id: reviewId } });

            // Recalculate average rating
            const stats = await tx.review.aggregate({
                where: { productId: existingReview.productId },
                _avg: { rating: true },
                _count: { rating: true }
            });

            await tx.product.update({
                where: { id: existingReview.productId },
                data: {
                    averageRating: stats._avg.rating ?? 0,
                    totalReviews: stats._count.rating
                }
            });
        });

        return res.status(200).json({ success: true, message: "Review deleted successfully" });
    } catch (error) {
        console.error("deleteReviewAdmin error", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const getRolesAndPermissions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const roles = await prisma.role.findMany({})
    const permissions = await prisma.permission.findMany({})
    return new ApiResponse(200, { roles, permissions }, "All roles and permissions are fetched").send(res)
})

const roleSchema = z.object({
    name: z.string().trim().min(2, "Role name must be at least 2 characters long"),
    description: z.string().trim().min(2, "Description atleast 2 characters long").optional()
})
export const createRole = asyncHandler(async (req: Request, res: Response) => {
    const parsed: any = roleSchema.safeParse(req.body)
    if (!parsed.success) {
        return new ApiError(400, "Invalid request body", parsed.error)
    }

    const { name, description } = parsed.data
    const roleExist = await prisma.role.findUnique({ where: { name: name?.toLowerCase() } })
    if (roleExist) {
        return new ApiError(400, "Role already exists", [])
    }
    const role = await prisma.role.create({ data: { name: name.toLowerCase(), description: description.toLowerCase() } })
    return new ApiResponse(201, { role }, 'New role created').send(res)
})

const updateRoleSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional()
})

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
    const parsed: any = updateRoleSchema.safeParse(req.body)
    if (!parsed.success) {
        return new ApiError(400, parsed.error, [])
    }
    const { roleId } = req.params
    const { name, description } = parsed.data
    const roleExist = await prisma.role.findUnique({ where: { id: roleId } })
    if (!roleExist) {
        return new ApiError(404, "Role not found")
    }
    const roleNameExist = await prisma.role.findFirst({ where: { name: name, id: { not: roleId } } })
    if (roleNameExist) {
        return new ApiError(400, "Role name already exists")
    }
    const role = await prisma.role.update({
        where: { id: roleId },
        data: {
            name: name?.toLowerCase(),
            description: description?.toLowerCase()
        }

    })
    return new ApiResponse(200, { role }, 'Role updated successfully').send(res)
})

export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
    const { roleId } = req.params
    const role = await prisma.role.findUnique({ where: { id: roleId } })
    if (!role) {
        return new ApiError(404, "Role not found")
    }
    const isAssigned = await prisma.userRole.findFirst({ where: { roleId } })
    if (isAssigned) {
        return new ApiError(400, "Role is assigned to some users so it cannot be deleted")
    }
    await prisma.role.delete({ where: { id: roleId } })
    return new ApiResponse(200, {}, "Role deleted successfully").send(res)
})

const assignPermissionSchema = z.object({
    roleId: z.string(),
    permissionIds: z.array(z.string())
})
export const assignPermissionToRoles = asyncHandler(async (req: Request, res: Response) => {
    const parsed: any = assignPermissionSchema.safeParse(req.body)
    if (!parsed.success) {
        return new ApiError(400, parsed.error, [])
    }
    const { roleId, permissionIds } = parsed.data
    const role = await prisma.role.findUnique({ where: { id: roleId } })
    if (!role) {
        return new ApiError(404, "Role not found")
    }
    const permissions = await prisma.permission.findMany({ where: { id: { in: permissionIds }, isActive: true } })
    if (permissions.length === 0) {
        return new ApiError(404, "No permissions found")
    }

    if (permissions.length !== permissionIds.length) {
        return new ApiError(400, "Invalid permission Ids")
    }
    await prisma.$transaction(async (tx) => {

        // Remove permissions that are not in the new list
        await tx.rolePermission.deleteMany({
            where: {
                roleId,
                permissionId: {
                    notIn: permissionIds
                }
            }
        });

        // Add new permissions
        await tx.rolePermission.createMany({
            data: permissionIds.map((permissionId: string) => ({
                roleId,
                permissionId
            })),
            skipDuplicates: true
        });

    });

    return new ApiResponse(200, {}, 'Permissions assigned successfully').send(res)
})

export const getAssignedPermissions = asyncHandler(async (req: Request, res: Response) => {
    const { roleId } = req.params
    const role = await prisma.role.findUnique({
        where: { id: roleId }
    })
    if (!role) {
        return new ApiError(404, "Role not found")
    }

    const permissions = await prisma.rolePermission.findMany({
        where: { roleId }, include: { permission: true }
    })
    return new ApiResponse(200, { permissions }, 'Assigned permissions fetched successfully').send(res)
})

const assignRolesToUserSchema = z.object({
    userId: z.string(),
    roleIds: z.array(z.string())
})

export const assignRolesToUser = asyncHandler(async (req: Request, res: Response) => {
    const parsed: any = assignRolesToUserSchema.safeParse(req.body)
    if (!parsed.success) {
        return new ApiError(400, parsed.error, [])
    }
    const { userId, roleIds } = parsed.data
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
        return new ApiError(404, "User not found")
    }
    const roles = await prisma.role.findMany({ where: { id: { in: roleIds }, isActive: true } })
    if (roles.length === 0) {
        return new ApiError(404, "No roles found")
    }
    if (roles.length !== roleIds.length) {
        return new ApiError(400, "Invalid role Ids")
    }
    await prisma.$transaction(async (tx) => {

        await tx.userRole.deleteMany({
            where: {
                userId,
                roleId: {
                    notIn: roleIds
                }
            }
        });

        await tx.userRole.createMany({
            data: roleIds.map((roleId: string) => ({
                userId,
                roleId
            })),
            skipDuplicates: true
        });

    });
    return new ApiResponse(200, {}, "Roles assigned successfully").send(res)
})

export const getAssignedRoles = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params
    const user = prisma.user.findUnique({
        where: { id: userId }
    })
    if (!user) {
        return new ApiError(404, "User not found", [])
    }

    const userRoles = await prisma.userRole.findMany({
        where: { userId },
        include: {
            role: true
        }
    })
    return new ApiResponse(200, { userRoles }, "Roles fetched successfully")
})
