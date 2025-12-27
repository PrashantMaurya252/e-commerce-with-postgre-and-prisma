
import { loginPayload, loginResponse, sendOTPResponse, signupPayload, signupResponse, verifyForgotPasswordOtpPayload, verifyForgotPasswordOtpResponse } from "@/types/auth"
import { ProductAPIResponse, ProductFilter } from "@/types/product";
import axios from "axios"
import api from "./interceptor";


const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;






export const signupAPI = async(payload:signupPayload):Promise<signupResponse>=>{
    try {
        const response = await api.post(`${BACKEND_URL}/api/auth/signup`,payload)
        return response.data
    } catch (error:any) {
        console.log("signup api error",error)
        throw new Error(error?.response.data.message || "Signup Error")
    }
}

export const loginAPI = async(payload:loginPayload):Promise<loginResponse>=>{
    try {
        const response = await api.post(`${BACKEND_URL}/auth/login`,payload,{
        withCredentials: true, // ✅ REQUIRED
      })
        return response.data
    } catch (error:any) {
        console.log("login api error",error)
        return {
      success: false,
      message:
        error?.response?.data?.message || "Login Error",
    };
    }
}

export const sendForgotPasswordOtp = async(email:string):Promise<sendOTPResponse>=>{
    try {
        const response = await api.post(`${BACKEND_URL}/api/auth/send-forgot-password-otp`,email)
        return response.data
    } catch (error:any) {
        console.log("sendForgotPasswordOTP api error",error)
        throw new Error(error?.response.data.message || "Send Forgot Password OTP Error")
    }
}

export const verifyForgotPasswordOtp = async(payload:verifyForgotPasswordOtpPayload):Promise<verifyForgotPasswordOtpResponse>=>{
    try {
        const response = await api.post(`${BACKEND_URL}/api/auth/verify-forgot-password-otp`,payload)
        return response.data
    } catch (error:any) {
        console.log("verify forgot password otp api error",error)
        throw new Error(error?.response.data.message || "Verify OTP Error")
    }
}


export const fetchAllProducts = async(filter:ProductFilter):Promise<ProductAPIResponse>=>{
    try {
        const response = await api.get(`${BACKEND_URL}/product/all-products?page=${filter?.page}&limit=${filter.limit}`,{withCredentials:true})
        return response.data
    } catch (error:any) {
        return {
            success:false,
            message:error.response.data.message,
            data:[]
        }
    }
}

export const meAPI = async()=>{
    const res = await api.post("/auth/me")
    return res.data
}