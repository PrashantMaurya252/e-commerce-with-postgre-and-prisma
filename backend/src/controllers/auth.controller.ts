import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import bcrypt from 'bcryptjs'


export const signUp = async(req:Request,res:Response)=>{
    try {
        const {email,username,password} = req.body

        const isExist = await prisma.user.findUnique({
            where:{
                email:email
            }
        })

        if(isExist){
            return res.status(400).json({
                success:false,
                message:"User already exist with this email ! try another one"
            })
        }

       const encryptedPassword = bcrypt.hash(process.env.JWT_SECRET || 'Secret',password)
    } catch (error:any) {
        console.error("error in signup",error)
        return res.status(500).json({
            success:false,
            message:"Server Not responding"
        })
    }
}