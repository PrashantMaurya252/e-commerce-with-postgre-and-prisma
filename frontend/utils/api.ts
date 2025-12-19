import { loginPayload, loginResponse, sendOTPResponse, signupPayload, signupResponse, verifyForgotPasswordOtpPayload, verifyForgotPasswordOtpResponse } from "@/types/auth"
import axios from "axios"


const BACKEND_URL = process.env.NEXT_BACKEND_API_URL


export const signupAPI = async(payload:signupPayload):Promise<signupResponse>=>{
    try {
        const response = await axios.post(`${BACKEND_URL}/api/auth/signup`,payload)
        return response.data
    } catch (error:any) {
        console.log("signup api error",error)
        throw new Error(error?.response.data.message || "Signup Error")
    }
}

export const loginAPI = async(payload:loginPayload):Promise<loginResponse>=>{
    try {
        const response = await axios.post(`${BACKEND_URL}/api/auth/login`,payload)
        return response.data
    } catch (error:any) {
        console.log("login api error",error)
        throw new Error(error?.response.data.message || "Login Error")
    }
}

export const sendForgotPasswordOtp = async(email:string):Promise<sendOTPResponse>=>{
    try {
        const response = await axios.post(`${BACKEND_URL}/api/auth/send-forgot-password-otp`,email)
        return response.data
    } catch (error:any) {
        console.log("sendForgotPasswordOTP api error",error)
        throw new Error(error?.response.data.message || "Send Forgot Password OTP Error")
    }
}

export const verifyForgotPasswordOtp = async(payload:verifyForgotPasswordOtpPayload):Promise<verifyForgotPasswordOtpResponse>=>{
    try {
        const response = await axios.post(`${BACKEND_URL}/api/auth/verify-forgot-password-otp`,payload)
        return response.data
    } catch (error:any) {
        console.log("verify forgot password otp api error",error)
        throw new Error(error?.response.data.message || "Verify OTP Error")
    }
}