import { Request, Response } from "express"
import { prisma } from "../config/prisma.js"
import { AuthRequest } from "../middlewares/auth.js"

export const getProfile = async(req:AuthRequest,res:Response)=>{
  try {
    const {userId} = req.params
    if(!userId){
        return res.status(400).json({success:false,message:"userId required"})
    }

    const user = await prisma.user.findUnique({where:{id:userId},omit:{password:true},include:{
        orders:true,
        files:true,
        addresses:true,
        cart:true,
        couponUsages:true

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

export const addAddress = async(req:AuthRequest,res:Response)=>{
    try {
        const userId = req.user?.userId
        if(!userId){
            return res.status(400).json({
                success:false,
                message:"You are unauthorize"
            })
        }
        const {line1,line2,pincode,phoneNumber1,phoneNumber2,landmark,city} = req.body
        const requiredFields = ["line1","phoneNumber1","pincode","city"]
        for(const field of requiredFields){
            if(!req.body[field] || req.body[field].toString().trim() === ""){
                return res.status(400).json({success:false,message:`${field} is required`})
            }
        }

        const newAddress = await prisma.address.create({data:{line1,line2,phoneNumber1,phoneNumber2,pincode,city,landmark,userId}})

        return res.status(200).json({success:true,message:"Address added successfully"})

    } catch (error) {
        console.error("Address addition error",error)
        return res.status(500).json({success:false,message:"Internal Server Error"})
    }
}

export const editAddress = async(req:AuthRequest,res:Response)=>{
    try {
        const userId = req.user?.userId
        const {addressId} = req.params
        if(!userId){
            return res.status(401).json({success:false,message:"Unauthorize"})
        }
        if(!addressId){
            return res.status(404).json({success:false,message:"Address not found"})
        }
        const {line1,line2,phoneNumber1,phoneNumber2,pincode,landmark,city} = req.body
        const requiredFields = ["line1","phoneNumber1","pincode","city"]
        for(const field of requiredFields){
            if(!req.body[field] || req.body[field].toString().trim() === ""){
                return res.status(400).json({success:false,message:`${field} is required`})
            }
        }

        const updatedAddress = await prisma.address.update({where:{id:addressId,userId},data:{line1,line2,phoneNumber1,phoneNumber2,pincode,city,landmark}})
        return res.status(200).json({success:true,message:"Address updated successfully",data:updatedAddress})
    } catch (error) {
        console.error("Edit address error",error)
        return res.status(500).json({success:false,message:"Internal Server Error"})
    }
}

export const getAllAddresses = async(req:AuthRequest,res:Response)=>{
    try {
        const userId = req.user?.userId
        if(!userId){
            return res.status(401).json({success:false,message:"Unauthorize"})
        }
        const addresses = await prisma.address.findMany({where:{userId}})
        return res.status(200).json({success:true,message:"All address fetched successfully",data:addresses})
    } catch (error) {
        console.error("Get All Addresses Error",error)
        return res.status(500).json({success:false,message:"Internal Server Error"})
    }
}

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { name, avatar } = req.body;
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name, avatar },
      omit: { password: true }
    });
    return res.status(200).json({ success: true, message: "Profile updated successfully", data: updatedUser });
  } catch (error) {
    console.error("updateProfile Error", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const deleteAddress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { addressId } = req.params;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!addressId) {
      return res.status(400).json({ success: false, message: "Address ID is required" });
    }
    
    const address = await prisma.address.findUnique({ where: { id: addressId, userId } });
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    const orderCount = await prisma.order.count({ where: { addressId } });
    if (orderCount > 0) {
      return res.status(400).json({ success: false, message: "Cannot delete this address because it is associated with one or more orders." });
    }

    await prisma.address.delete({ where: { id: addressId } });
    return res.status(200).json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    console.error("deleteAddress Error", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};