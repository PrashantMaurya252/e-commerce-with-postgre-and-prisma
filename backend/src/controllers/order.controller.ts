import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";



export const allOrders = async(req:Request,res:Response)=>{
    try {
        const userId = req.user?.userId
        if(!userId){
            return res.status(401).json({success:false,message:"Unauthorized from controller"})
        }
        const orders = await prisma.order.findMany({where:{userId},include:{items:{
            include:{product:{include:{files:true}}}
        },files:true,payment:true,address:true},orderBy:{
            createdAt:"desc"
        }})
        return res.status(200).json({success:true,data:orders})

    } catch (error) {
        console.log("all orders error")
        return res.status(500).json({success:false,message:"Internal Server error"})
    }
}