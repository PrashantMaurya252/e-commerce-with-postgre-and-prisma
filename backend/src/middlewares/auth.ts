import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken'
import { User } from "../utils/jwt.js";


export const auth= async(req:Request & {user:any},res:Response,next:NextFunction)=>{
    try {
        const token =  req.headers?.authorization?.split(' ')[1] || req.cookies['auth-token']

        if(!token){
            return res.status(401).json({success:false,message:"You are unauthorized"})
        }

        const decoded = jwt.verify(token,process.env.JWT_SECRET as string)
        if(!decoded){
            return res.status(401).json({success:false,message:"Your token is incorrect"})
        }
        req.user = decoded
        next()
    } catch (error) {
        console.error("Something went wrong with auth middleware",error)
        return res.status(500).json({success:false,message:"You are unauthoried"})
    }
}