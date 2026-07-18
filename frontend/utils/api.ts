
import { loginPayload, loginResponse, normalAPIResponse, sendOTPResponse, signupPayload, signupResponse, verifyForgotPasswordOtpPayload, verifyForgotPasswordOtpResponse } from "@/types/auth"
import { ProductAPIResponse, ProductFilter } from "@/types/product";
import axios from "axios"
import api from "./interceptor";


export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL as string;






export const signupAPI = async(payload:signupPayload):Promise<signupResponse>=>{
    try {
        const response = await axios.post(`${BACKEND_URL}/auth/signup`,payload)
        return response.data
    } catch (error:any) {
        console.log("signup api error",error)
        console.log("login api error",error)
        return {
      success: false,
      message:
        error?.response?.data?.message || "Sign Up Error",
    };
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

export const googleLogin = async(token:string):Promise<loginResponse>=>{
    try {
        const response = await axios.post(`${BACKEND_URL}/auth/google-login`,{token},{
        withCredentials: true, // ✅ REQUIRED
      })
        return response.data
    } catch (error:any) {
        console.log("google login api error",error)
        return {
      success: false,
      message:
        error?.response?.data?.message || "Google Login Error",
    };
    }
}

export const logoutHandler = async():Promise<loginResponse>=>{
    try {
        const response = await api.post(`${BACKEND_URL}/auth/logout`,{},{
        withCredentials: true, // ✅ REQUIRED
      })
        return response.data
    } catch (error:any) {
        console.log("logout api error",error)
        return {
      success: false,
      message:
        error?.response?.data?.message || "Logout Error",
    };
    }
}

export const sendForgotPasswordOtpToEmail = async(email:string):Promise<sendOTPResponse>=>{
    try {
        const response = await axios.post(`${BACKEND_URL}/auth/send-forgot-password-otp`,email)
        return response.data
    } catch (error:any) {
        console.log("sendForgotPasswordOTP api error",error)
        throw new Error(error?.response.data.message || "Send Forgot Password OTP Error")
    }
}

export const verifyForgotPasswordOtp = async(payload:verifyForgotPasswordOtpPayload):Promise<verifyForgotPasswordOtpResponse>=>{
    try {
        const response = await axios.post(`${BACKEND_URL}/auth/verify-forgot-password-otp`,payload)
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
          minPrice: filter.minPrice,
          maxPrice: filter.maxPrice,
          brand: filter.brand,
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

export const fetchBrands = async (): Promise<{ success: boolean; data: string[] }> => {
  try {
    const response = await api.get(`${BACKEND_URL}/product/brands`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    return { success: false, data: [] };
  }
};

export const fetchCategories = async (): Promise<{ success: boolean; data: any[] }> => {
  try {
    const response = await api.get(`${BACKEND_URL}/category/get-all-category`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    return { success: false, data: [] };
  }
};

export const getAllFaqsAPI = async (): Promise<{ success: boolean; data: any[] }> => {
  try {
    const response = await api.get(`${BACKEND_URL}/faq`);
    return response.data;
  } catch (error: any) {
    console.error("fetch faqs error", error);
    return { success: false, data: [] };
  }
};

/* -------------------------------------------------------------------------- */
/*                              BANNER APIs                                   */
/* -------------------------------------------------------------------------- */

export const getPublicBannersAPI = async (position?: string, limit?: number) => {
  try {
    const params = new URLSearchParams();
    if (position) params.append("position", position);
    if (limit) params.append("limit", limit.toString());
    const response = await api.get(`${BACKEND_URL}/banner/public?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    return { success: false, data: [] };
  }
};

export const getAdminBannersAPI = async (params: { page?: number; limit?: number; position?: string; isActive?: boolean; includeDeleted?: boolean }) => {
  try {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page.toString());
    if (params.limit) query.append("limit", params.limit.toString());
    if (params.position) query.append("position", params.position);
    if (params.isActive !== undefined) query.append("isActive", params.isActive.toString());
    if (params.includeDeleted !== undefined) query.append("includeDeleted", params.includeDeleted.toString());

    const response = await api.get(`${BACKEND_URL}/banner/admin?${query.toString()}`, { withCredentials: true });
    return response.data;
  } catch (error: any) {
    return { success: false, data: [], pagination: {} };
  }
};

export const createBannerAPI = async (formData: FormData) => {
  try {
    const response = await api.post(`${BACKEND_URL}/banner`, formData, {
      withCredentials: true,
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || "Failed to create banner" };
  }
};

export const updateBannerAPI = async (id: string, formData: FormData) => {
  try {
    const response = await api.put(`${BACKEND_URL}/banner/${id}`, formData, {
      withCredentials: true,
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || "Failed to update banner" };
  }
};

export const toggleBannerStatusAPI = async (id: string) => {
  try {
    const response = await api.patch(`${BACKEND_URL}/banner/${id}/toggle`, {}, { withCredentials: true });
    return response.data;
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || "Failed to toggle banner" };
  }
};

export const deleteBannerAPI = async (id: string) => {
  try {
    const response = await api.delete(`${BACKEND_URL}/banner/${id}`, { withCredentials: true });
    return response.data;
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || "Failed to delete banner" };
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

export const getAddressesAPI = async (): Promise<normalAPIResponse> => {
  try {
    const response = await api.get(`${BACKEND_URL}/address`, { withCredentials: true })
    return response.data
  } catch (error: any) {
    console.error("get addresses error", error)
    return { success: false, message: error.response?.data?.message || "Internal Server error" }
  }
}

export const addAddressAPI = async (payload: any): Promise<normalAPIResponse> => {
  try {
    const response = await api.post(`${BACKEND_URL}/address`, payload, { withCredentials: true })
    return response.data
  } catch (error: any) {
    console.error("add address error", error)
    return { success: false, message: error.response?.data?.message || "Internal Server error" }
  }
}


export const getUserProfile = async(userId:string):Promise<normalAPIResponse>=>{
  try {
    const response = await api.get(`${BACKEND_URL}/user/user-profile/${userId}`,{withCredentials:true})
    return response.data
  } catch (error:any) {
    console.error("get user profile error",error)
    return {
      success:false,
      message:error.response.data.message || "Internal Server error"
    }
  }
}