import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import bcrypt from "bcryptjs";
import { success, z } from "zod";
import { generateAccessToken } from "../utils/jwt.js";
import { generateOtp, sendOtpMail } from "../utils/mailer.js";

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
            userId:user.id,
            email:user.email,
            name:user.name,
            isAdmin:user.isAdmin
        }
        const {password:_,...userData} =user
        const token = generateAccessToken(userPayload)
        res.cookie("access-token",token,{
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


export const sendEmailVerificationOtp = async(req:Request,res:Response)=>{
  try {
    const userId = req.user?.userId
    const {email} = req.body

    const user = await prisma.user.findUnique({where:{id:userId,email}})
    if(!user){
      return res.status(404).json({success:false,message:"User not found"})
    }

    const otp = generateOtp()
    await prisma.otp.create({data:{
      email,
      code:otp,
      type:"EMAIL_VERIFICATION",
      expiresAt:new Date(Date.now()+5*60*1000)
    }})

    await sendOtpMail(email,otp,"Verify Email")
    return res.status(200).json({success:true,message:"Verification Otp Send to your mail and it is valid for 5 minutes"})
  } catch (error) {
    console.error("sendEmailVerificationOtp error",error)
    return res.status(500).json({success:false,message:"Internal Server Error"})
  }
}


export const verifyEmailOtp = async(req:Request,res:Response)=>{
  try {
    const {email,otp} = req.body
    const record = await prisma.otp.findFirst({
      where:{
        email,
        code:otp,
        type:"EMAIL_VERIFICATION",
        isUsed:false,
        expiresAt:{gt:new Date()}
      }
    })

    if(!record){
      return res.status(400).json({success:false,message:"invalid OTP"})
    }

    await prisma.$transaction([
      prisma.otp.update({
        where:{id:record.id},
        data:{isUsed:true}
      }),
      prisma.user.update({
        where:{email},
        data:{isVerified:true}
      })
    ])
    return res.json({success:true,message:"Email Verified"})
  } catch (error) {
    console.error("verify email otp error",error)
    return res.status(500).json({success:false,message:"Internal Server Error"})
  }
}

export const sendForgotPasswordOtp = async(req:Request,res:Response)=>{
  try {
    
    const {email} = req.body
    const user = await prisma.user.findUnique({where:{email}})
    const otp = generateOtp()
    const record = await prisma.otp.create({data:{
      email,
      code:otp,
      type:"FORGOT_PASSWORD",
      expiresAt:new Date(Date.now()+5*60*1000)
    }})

    await sendOtpMail(email,otp,"Reset Password")
    return res.status(200).json({success:true,message:"Forgot password otp sent to your email"})
  } catch (error) {
    console.error("send forgot password otp error ",error)
    return res.status(500).json({success:false,message:"Internal Server Error"})
  }
}


export const verifyForgotPasswordOtp = async(req:Request,res:Response)=>{
  try {
    const {email,otp,newPassword} = req.body
    const user = await prisma.user.findUnique({where:{email}})
    if(!user){
      return res.status(404).json({success:false,message:"User not found"})
    } 

    const record = await prisma.otp.findFirst({where:{email,code:otp,type:"FORGOT_PASSWORD",expiresAt:{gt:new Date()}}})
    if(!record){
      return res.status(404).json({success:false,message:"Invalid Otp"})
    }
    const hashedPassword = await bcrypt.hash(newPassword,10)

    prisma.$transaction([
      prisma.otp.update({where:{id:record.id},data:{isUsed:true}}),
      prisma.user.update({where:{email},data:{password:hashedPassword}})
    ])

    return res.status(200).json({success:true,message:"Password Updated Successfully"})
  } catch (error) {
    console.error("verify forgot password otp",error)
    return res.status(500).json({success:false,message:"Internal Server Error"})
  }
}
