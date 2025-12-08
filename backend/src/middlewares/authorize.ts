import { NextFunction, Request, Response } from "express";


export const authorize = async(req:Request,res:Response,next:NextFunction)=>{
    try {
        
    } catch (error) {
        console.error("authorize error",error)
        return res.status(500).json({success:false,message:"Something went wrong"})
    }
}