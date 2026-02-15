import { Request, Response } from "express"
import { prisma } from "../config/prisma.js"

export const getProfile = async(req:Request,res:Response)=>{
  try {
    const {userId} = req.params
    if(!userId){
        return res.status(400).json({success:false,message:"userId required"})
    }

    const user = await prisma.user.findUnique({where:{id:userId},omit:{password:true},include:{
        orders:true,
        files:true,
        addresses:true

    }})
    if(!user){
        return res.status(404).json({success:false,message:"User not found"})
    }

    return res.status(200).json({success:true,mesage:"Profile fetched successfully",data:user})


  } catch (error) {
    console.error("getProfile Error")
    return res.status(500).json({success:false,message:"Internal Server Error"})
  }
}