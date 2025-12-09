import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import bcrypt from "bcryptjs";
import { success, z } from "zod";
import { generateAccessToken } from "../utils/jwt.js";

const signupSchema = z.object({
  email: z.string(),
  username: z.string().min(3),
  password: z.string().min(6),
});
export const signUp = async (req: Request, res: Response) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        errors: parsed.error,
      });
    }
    const { email, username, password } = parsed.data;

    const isExist = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (isExist) {
      return res.status(400).json({
        success: false,
        message: "User already exist with this email ! try another one",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        email: email,
        name: username,
        password: hashedPassword,
        isAdmin: false,
      },
    });

    res
      .status(201)
      .json({ success: true, message: "user created successfully" });
  } catch (error: any) {
    console.error("error in signup", error);
    return res.status(500).json({
      success: false,
      message: "Server Not responding",
    });
  }
};


const loginSchema=z.object({
    email:z.string(),
    password:z.string().min(6)
})
export const login = async(req:Request,res:Response)=>{
    try {
        const parsed = loginSchema.safeParse(req.body)
        if(!parsed.success){
            return res.status(400).json({
                success:false,
                message:parsed.error
            })
        }
        const {email,password} = parsed.data
        const user = await prisma.user.findUnique({
            where:{
                email
            }
        }) 
        if(!user){
            return res.status(401).json({
                success:false,
                message:"Credentials wrong"
            })
        }

        const isPasswordValid = await bcrypt.compare(password,user.password)

        if(!isPasswordValid){
            return res.status(401).json({
                success:false,
                message:"Credentials wrong"
            })
        }
        const userPayload = {
            email:user.email,
            name:user.name,
            isAdmin:user.isAdmin
        }
        const {password:_,...userData} =user
        const token = generateAccessToken(userPayload)
        res.cookie("auth-token",token,{
            httpOnly:true,
            secure:process.env.NODE_ENV === 'production',
            maxAge:1000*60*60*24,
            sameSite:process.env.NODE_ENV === 'production' ? "strict" : "lax"
        })
        return res.status(200).json({success:true,data:{
            userData,token
        }})
    } catch (error) {
        console.error("login error",error)
        return res.status(500).json({
            success:false,
            message:"Server not working"
        })
    }
}
