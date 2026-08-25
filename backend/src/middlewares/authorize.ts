import { NextFunction, Request, Response } from "express";
import { AuthRequest } from "./auth.js";
import { prisma } from "../config/prisma.js";


export const authorize = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ success: false, message: "Admin only" })
        }
        next()
    } catch (error) {
        console.error("authorize error", error)
        return res.status(500).json({ success: false, message: "Something went wrong" })
    }
}

export const authorizeRoles = (...requiredRoles: string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, message: "Unauthorized" })
            }
            const { userId } = req.user
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    userRoles: {
                        include: {
                            role: true
                        }
                    }
                }
            })

            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" })
            }

            const userRoles = user?.userRoles.map((userRole) => userRole.role.name)
            const hasRequiredRoles = requiredRoles.some((role) => userRoles.includes(role))
            console.log("User Roles", userRoles, hasRequiredRoles)
            if (!hasRequiredRoles) {
                return res.status(403).json({ success: false, message: "You don't have permission to perform this action" })
            }
            next()
        } catch (error) {
            console.log("Authorized roles error", error)
            return res.status(500).json({ success: false, message: "Internal Server Error" })
        }
    }

}

export const authorizPermissions = (...requiredPermissions: string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, message: "Unauthorized" })
            }

            if (req.user.userRoles.includes("SuperAdmin")) {
                return next()
            }

            const user = await prisma.user.findUnique({
                where: {
                    id: req.user.userId,
                },
                include: {
                    userRoles: {
                        include: {
                            role: {
                                include: {
                                    rolePermissions: {
                                        include: {
                                            permission: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });;
            if (!user) {
                return res.status(404).json({ success: false, message: 'User Not Found' })
            }

            console.log("UserRole", user.userRoles)
            const permissions = user.userRoles.flatMap((userRole) => userRole.role.rolePermissions.map((rolePermission) => rolePermission.permission.action))

            const hasPermission = requiredPermissions.every((permission) => permissions.includes(permission))

            if (!hasPermission) {
                return res.status(403).json({ success: false, message: "You dont have permission to perform this action" })
            }

            next()
        } catch (error) {
            console.log("User Authorization error", error)
            return res.status(500).json({ success: false, message: "Internal Server Error" })
        }
    }
}