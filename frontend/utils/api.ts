
import { loginPayload, loginResponse, normalAPIResponse, sendOTPResponse, signupPayload, signupResponse, verifyForgotPasswordOtpPayload, verifyForgotPasswordOtpResponse } from "@/types/auth"
import { ProductAPIResponse, ProductFilter } from "@/types/product";
import axios from "axios"
import api from "./interceptor";


export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;






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
        const response = await axios.post(`${BACKEND_URL}/auth/login`,payload,{
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


export const fetchAllProducts = async (
  filter: ProductFilter
): Promise<ProductAPIResponse> => {
  try {
    const response = await api.get(
      `${BACKEND_URL}/product/all-products`,
      {
        params: {
          page: filter.page,
          limit: filter.limit,
          search: filter.search,
          category: filter.category !== "ALL" ? filter.category : undefined,
          price: filter.price,
        },
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || "Something went wrong",
      data: [],
    };
  }
};


export const meAPI = async()=>{

    const res = await api.get("/auth/me",{withCredentials:true})
    return res.data
}

export const refreshAPI = async()=>{
    const res = await api.get("/auth/refresh-token",{withCredentials:true})
    return res.data
}


export const productDetails = async(productId:string):Promise<normalAPIResponse>=>{
    try {
      const response = await api.get(`${BACKEND_URL}/product/product-details/${productId}`)
      return response.data
    } catch (error:any) {
      console.error("product details error",error)
      return {
        success:false,
        message:error.response?.data.message || "Internal Server Error"
      }
    }
}


export const addToCart= async(productId:string):Promise<normalAPIResponse>=>{
  try {
    const response = await api.post(`${BACKEND_URL}/cart/add-to-cart/${productId}`)
    return response.data
  } catch (error:any) {
    console.error("Add to cart Error",error)
    return {
      success:false,
      message:error.response?.data.message || "Internal Server Error"
    }
  }
}

export const decreaseFromCart= async(productId:string):Promise<normalAPIResponse>=>{
  try {
    const response = await api.post(`${BACKEND_URL}/cart/decrease-from-cart/${productId}`)
    return response.data
  } catch (error:any) {
    console.error("decrease from cart Error",error)
    return {
      success:false,
      message:error.response?.data.message || "Internal Server Error"
    }
  }
}

export const deleteFromCart= async(productId:string):Promise<normalAPIResponse>=>{
  try {
    const response = await api.delete(`${BACKEND_URL}/cart/delete-cart-item/${productId}`)
    return response.data
  } catch (error:any) {
    console.error("Delete from cart Error",error)
    return {
      success:false,
      message:error.response?.data.message || "Internal Server Error"
    }
  }
}

export const getCartItems= async():Promise<normalAPIResponse>=>{
  try {
    const response = await api.post(`${BACKEND_URL}/cart/cartItems`)
    return response.data
  } catch (error:any) {
    console.error("decrease from cart Error",error)
    return {
      success:false,
      message:error.response?.data.message || "Internal Server Error"
    }
  }
}

export const getAllCoupons = async():Promise<normalAPIResponse>=>{
  try {
    const response = await api.get(`${BACKEND_URL}/cart/get-all-coupons`,{withCredentials:true})
    return response.data
  } catch (error:any) {
    console.error("get all coupons error",error)
    return {
      success:false,
      message:error.response.data.message || "Internal Server error"
    }
  }
}

export const applyCoupon = async(payload:any):Promise<normalAPIResponse>=>{
  try {
    const response = await api.post(`${BACKEND_URL}/cart/apply-coupon`,payload,{withCredentials:true})
    return response.data
  } catch (error:any) {
    console.error("Apply Coupon Error",error)
    return {
      success:false,
      message:error.response?.data.message || "Internal Server Error"
    }
  }
}


export const createPaymentIntent = async(payload:any):Promise<normalAPIResponse>=>{
  try {
    const response = await api.post(`${BACKEND_URL}/payment/create-payment-intent`,payload,{withCredentials:true})
    return response.data
  } catch (error:any) {
    console.error("Create Payment Intent",error)
    return {
      success:false,
      message:error.response?.data.message || "Internal Server Error"
    }
  }
}

export const checkout = async(payload:any):Promise<normalAPIResponse>=>{
  try {
    const response = await api.post(`${BACKEND_URL}/cart/checkout`,payload,{withCredentials:true})
    return response.data
  } catch (error:any) {
    console.error("checkout error",error)
    return {
      success:false,
      message:error.response?.data.message || "Internal Server Error"
    }
  }
}

export const getAllOrders = async():Promise<normalAPIResponse>=>{
  try {
    const response = await api.get(`${BACKEND_URL}/orders/all-orders`,{withCredentials:true})
    return response.data
  } catch (error:any) {
    console.error("get all orders error",error)
    return {
      success:false,
      message:error.response.data.message || "Internal Server error"
    }
  }
}