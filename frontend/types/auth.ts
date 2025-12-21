import { User } from "@/redux/slices/authSlice"

export interface signupPayload{
    email:string,
    username:string,
    password:string
}

export interface signupResponse{
    success:boolean,
    message:string,
    data?:{
        id:string,
        name:string,
        email:string
    }
}

export interface loginPayload{
    email:string,
    password:string
}

export interface loginResponse{
    success:boolean,
    message:string,
    data?:{
        userData:User,
        token:string
    }
}

export interface sendOTPResponse{
    success:boolean,
    message:string,
    
}

export interface verifyForgotPasswordOtpPayload{
    email:string,
    otp:string,
    newPassword:string
}

export interface verifyForgotPasswordOtpResponse{
    success:boolean,
    message:string
}