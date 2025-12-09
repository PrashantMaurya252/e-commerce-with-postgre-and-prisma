import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken'
import { User } from "../utils/jwt.js";

export interface AuthRequest extends Request{
    user?:any
}


export const auth= async(req:AuthRequest,res:Response,next:NextFunction)=>{
    try {
        const token =  req.headers?.authorization?.split(' ')[1] || req.cookies['access-token']

        if(!token){
            return res.status(401).json({success:false,message:"You are unauthorized"})
        }

        const decoded = jwt.verify(token,process.env.JWT_SECRET as string)
        
        req.user = decoded
        next()
    } catch (error) {
        console.error("Something went wrong with auth middleware",error)
        return res.status(500).json({success:false,message:"You are unauthoried"})
    }
}