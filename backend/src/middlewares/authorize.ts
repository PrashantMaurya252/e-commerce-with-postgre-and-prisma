import { NextFunction, Request, Response } from "express";
import { AuthRequest } from "./auth.js";


export const authorize = async(req:AuthRequest,res:Response,next:NextFunction)=>{
    try {
        if(!req.user.isAdmin){
            return res.status(403).json({success:false,message:"Admin only"})
        }
        next()
    } catch (error) {
        console.error("authorize error",error)
        return res.status(500).json({success:false,message:"Something went wrong"})
    }
}