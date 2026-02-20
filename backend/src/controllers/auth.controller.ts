import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import bcrypt from "bcryptjs";
import { success, z } from "zod";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import { generateOtp, sendOtpMail } from "../utils/mailer.js";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../middlewares/auth.js";
import {OAuth2Client} from "google-auth-library"

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
        const {password:_,createdAt,...userData} =user
        const accessToken = generateAccessToken(userPayload)
        const refreshToken = generateRefreshToken({userId:user.id})

        await prisma.refreshToken.create({
          data:{
            token:refreshToken,
            userId:user.id,
            expiresAt:new Date(Date.now() + 7*24*60*60*1000)
          }
        })

        
        // res.cookie("access-token",accessToken,{
        //     httpOnly:true,
        //     secure:process.env.NODE_ENV === 'production',
        //     sameSite:process.env.NODE_ENV === 'production' ? "strict" : "lax"
        // })
        // res.cookie("role",user?.isAdmin ? "Admin":"User",{
        //     httpOnly:true,
        //     secure:process.env.NODE_ENV === 'production',
        //     sameSite:process.env.NODE_ENV === 'production' ? "strict" : "lax"
        // })

        res.cookie("refresh-token",refreshToken,{
          httpOnly:true,
            secure:process.env.NODE_ENV === 'production',
            sameSite:process.env.NODE_ENV === 'production' ? "strict" : "lax"
        })
        return res.status(200).json({success:true,data:{
            userData,accessToken
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


export const refreshToken = async(req:Request,res:Response)=>{
  try {
    const token = req.cookies["refresh-token"];
    if(!token) return res.status(401).json({success:false,message:"Unauthorized"})
    
    const stored = await prisma.refreshToken.findUnique({where:{token}})
    if(!stored || stored.expiresAt < new Date()){
      return res.status(401).json({success:false,message:"Unauthorized"})
    }

    const payload = jwt.verify(token,process.env.JWT_REFRESH_TOKEN_SECRET!) as any
    const user = await prisma.user.findUnique({where:{id:payload.userId}})
    if(!user){
      return res.status(401).json({success:false,message:"Unauthorized"})
    }

    const userPayload = {
            userId:user.id,
            email:user.email,
            name:user.name,
            isAdmin:user.isAdmin
        }
    const newAccessToken = generateAccessToken(userPayload)
    return res.status(200).json({success:true,accessToken:newAccessToken})
  } catch (error) {
    console.error("refresh token error",error)
    return res.status(500).json({success:false,message:"Internal Server Error"})
  }
}


export const me = async(req:AuthRequest,res:Response)=>{
  try {

    if(!req.user?.userId){
      return res.status(401).json({success:false,message:"Unauthorized"})
    }
    const user = await prisma.user.findUnique({where:{id:req.user?.userId},select:{id:true,email:true,name:true,isAdmin:true}})

    if(!user){
      return res.status(404).json({success:false,message:"User not found"})
    }

    return res.status(200).json({success:true,user})

  } catch (error) {
    console.error("me controller error",error)
    return res.status(500).json({success:false,message:"Internal Server Error"})
  }
}

export const logout = async(req:AuthRequest,res:Response)=>{
  try {
    const userId = req.user?.userId
    if(!userId){
      return res.status(401).json({success:false,message:"Unauthorized"})
    }
    const user = await prisma.user.findUnique({where:{id:userId}})
    if(!user){
      return res.status(401).json({success:false,message:"Unauthorized"})
    }

    await prisma.refreshToken.deleteMany({
      where:{userId:userId}
    })
    res.clearCookie("refresh-token",{
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    })

    return res.status(200).json({success:true,message:"User logout successfully"})

  } catch (error) {
    console.error("logout error",error)
    return res.status(500).json({success:false,message:"Internal Server Error"})
  }
}

export const googleAuth = async(req:Request,res:Response)=>{
  try {
    const {token} = req.body
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
    const ticket = await client.verifyIdToken({
      idToken:token,
      audience:process.env.GOOGLE_CLIENT_ID
    })

    const payload = ticket.getPayload()
    if(!payload || !payload.email){
      return res.status(400).json({
        success:false,
        message:"Invalid Google Token"
      })
    }
    const {email,sub,name,picture}  = payload

    const userExist = await prisma.user.findUnique({where:{email}})
    if(userExist && userExist.provider === "LOCAL"){
      return res.status(400).json({
        success:false,
        message:"User already exist with email & passowrd"
      })
    }

    let user
    if(userExist && userExist.provider === "GOOGLE"){
      user = userExist
    }else{
      user = await prisma.user.create({
        data:{
          email,
          name,
          googleId:sub,
          provider:"GOOGLE",
          avatar:picture,
          isVerified:true
        }
      })
    }

    return res.status(200).json({success:true,message:"User Logged In Successfully",data:user})
  } catch (error) {
    console.error("Google Auth Error",error)
    return res.status(500).json({success:false,message:"Internal Server Error"})
  }
}
