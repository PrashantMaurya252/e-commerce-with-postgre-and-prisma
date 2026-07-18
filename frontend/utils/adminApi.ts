import api from "./interceptor";
import { normalAPIResponse } from "@/types/auth";

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

// ──────────────────── Dashboard ─────────────────────
export const getDashboardStats = async (): Promise<normalAPIResponse> => {
  try {
    const res = await api.get(`${BACKEND_URL}/admin/dashboard-stats`, {
      withCredentials: true,
    });
    return res.data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Internal Server Error",
    };
  }
};

// ──────────────────── Orders ─────────────────────
export const getAdminOrders = async (
  page = 1,
  limit = 10,
  status?: string
): Promise<normalAPIResponse> => {
  try {
    const res = await api.get(`${BACKEND_URL}/admin/orders`, {
      params: { page, limit, status: status !== "ALL" ? status : undefined },
      withCredentials: true,
    });
    return res.data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Internal Server Error",
    };
  }
};

export const updateOrderStatus = async (
  orderId: string,
  status: string
): Promise<normalAPIResponse> => {
  try {
    const res = await api.patch(
      `${BACKEND_URL}/admin/orders/${orderId}`,
      { status },
      { withCredentials: true }
    );
    return res.data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Internal Server Error",
    };
  }
};

// ──────────────────── Users ─────────────────────
export const getAdminUsers = async (
  page = 1,
  limit = 10
): Promise<normalAPIResponse> => {
  try {
    const res = await api.get(`${BACKEND_URL}/admin/users`, {
      params: { page, limit },
      withCredentials: true,
    });
    return res.data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Internal Server Error",
    };
  }
};

export const toggleUserStatus = async (
  userId: string,
  isActive: boolean
): Promise<normalAPIResponse> => {
  try {
    const res = await api.patch(
      `${BACKEND_URL}/admin/users/${userId}/status`,
      { isActive },
      { withCredentials: true }
    );
    return res.data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Internal Server Error",
    };
  }
};

// ──────────────────── Products ─────────────────────
export const getAdminProducts = async (
  page = 1,
  limit = 10
): Promise<normalAPIResponse> => {
  try {
    const res = await api.get(`${BACKEND_URL}/admin/products-reviews`, {
      params: { page, limit },
      withCredentials: true,
    });
    return res.data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Internal Server Error",
    };
  }
};

export const createProduct = async (
  formData: FormData
): Promise<normalAPIResponse> => {
  try {
    const res = await api.post(
      `${BACKEND_URL}/product/add-product`,
      formData,
      {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return res.data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Internal Server Error",
    };
  }
};

export const updateProduct = async (
  productId: string,
  formData: FormData
): Promise<normalAPIResponse> => {
  try {
    const res = await api.put(
      `${BACKEND_URL}/product/update-product/${productId}`,
      formData,
      {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return res.data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Internal Server Error",
    };
  }
};

export const deleteProduct = async (
  productId: string
): Promise<normalAPIResponse> => {
  try {
    const res = await api.delete(
      `${BACKEND_URL}/product/delete-product/${productId}`,
      { withCredentials: true }
    );
    return res.data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Internal Server Error",
    };
  }
};

export const deleteReview = async (
  reviewId: string
): Promise<normalAPIResponse> => {
  try {
    const res = await api.delete(`${BACKEND_URL}/admin/reviews/${reviewId}`, {
      withCredentials: true,
    });
    return res.data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Internal Server Error",
    };
  }
};

// ──────────────────── Categories ─────────────────────
export const getAllCategories = async (): Promise<normalAPIResponse> => {
  try {
    const res = await api.get(`${BACKEND_URL}/category/all-categories`, {
      withCredentials: true,
    });
    return res.data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Internal Server Error",
    };
  }
};

export const createCategory = async (
  formData: FormData
): Promise<normalAPIResponse> => {
  try {
    const res = await api.post(
      `${BACKEND_URL}/category/add-category`,
      formData,
      {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return res.data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Internal Server Error",
    };
  }
};

export const updateCategory = async (
  id: string,
  formData: FormData
): Promise<normalAPIResponse> => {
  try {
    const res = await api.put(
      `${BACKEND_URL}/category/update-category/${id}`,
      formData,
      {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return res.data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Internal Server Error",
    };
  }
};

export const deleteCategory = async (
  id: string
): Promise<normalAPIResponse> => {
  try {
    const res = await api.delete(
      `${BACKEND_URL}/category/delete-category/${id}`,
      { withCredentials: true }
    );
    return res.data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Internal Server Error",
    };
  }
};

// ──────────────────── Coupons ─────────────────────
export const getAdminCoupons = async (): Promise<normalAPIResponse> => {
  try {
    const res = await api.get(`${BACKEND_URL}/admin/get-all-coupons`, {
      withCredentials: true,
    });
    return res.data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Internal Server Error",
    };
  }
};

export const createCoupon = async (
  data: Record<string, any>
): Promise<normalAPIResponse> => {
  try {
    const res = await api.post(`${BACKEND_URL}/admin/create-coupon`, data, {
      withCredentials: true,
    });
    return res.data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Internal Server Error",
    };
  }
};

export const updateCoupon = async (
  couponId: string,
  data: Record<string, any>
): Promise<normalAPIResponse> => {
  try {
    const res = await api.put(
      `${BACKEND_URL}/admin/update-coupon`,
      { couponId, ...data },
      { withCredentials: true }
    );
    return res.data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Internal Server Error",
    };
  }
};

export const deleteCoupon = async (
  couponId: string
): Promise<normalAPIResponse> => {
  try {
    const res = await api.patch(
      `${BACKEND_URL}/admin/remove-coupon`,
      { couponId },
      { withCredentials: true }
    );
    return res.data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Internal Server Error",
    };
  }
};

// ──────────────────── FAQs ─────────────────────
export const getAllFaqs = async (
  page = 1,
  limit = 20,
  includeInactive = true
): Promise<normalAPIResponse> => {
  try {
    const res = await api.get(`${BACKEND_URL}/faq`, {
      params: { page, limit, includeInactive },
      withCredentials: true,
    });
    return res.data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Internal Server Error",
    };
  }
};

export const createFaq = async (data: {
  question: string;
  answer: string;
  isActive?: boolean;
}): Promise<normalAPIResponse> => {
  try {
    const res = await api.post(`${BACKEND_URL}/faq/create`, data, {
      withCredentials: true,
    });
    return res.data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Internal Server Error",
    };
  }
};

export const updateFaq = async (
  faqId: string,
  data: Partial<{ question: string; answer: string; isActive: boolean }>
): Promise<normalAPIResponse> => {
  try {
    const res = await api.put(`${BACKEND_URL}/faq/${faqId}`, data, {
      withCredentials: true,
    });
    return res.data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Internal Server Error",
    };
  }
};

export const deleteFaq = async (
  faqId: string
): Promise<normalAPIResponse> => {
  try {
    const res = await api.delete(`${BACKEND_URL}/faq/${faqId}`, {
      withCredentials: true,
    });
    return res.data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Internal Server Error",
    };
  }
};

export const toggleFaqStatus = async (
  faqId: string
): Promise<normalAPIResponse> => {
  try {
    const res = await api.patch(
      `${BACKEND_URL}/faq/${faqId}/toggle`,
      {},
      { withCredentials: true }
    );
    return res.data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Internal Server Error",
    };
  }
};

// ──────────────────── Campaigns ─────────────────────
export const getAllCampaigns = async (
  page = 1,
  limit = 10,
  type?: "instant" | "scheduled"
): Promise<normalAPIResponse> => {
  try {
    const res = await api.get(`${BACKEND_URL}/notification-campaign`, {
      params: { page, limit, type },
      withCredentials: true,
    });
    return res.data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Internal Server Error",
    };
  }
};

export const getCampaignById = async (
  campaignId: string
): Promise<normalAPIResponse> => {
  try {
    const res = await api.get(
      `${BACKEND_URL}/notification-campaign/${campaignId}`,
      { withCredentials: true }
    );
    return res.data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Internal Server Error",
    };
  }
};

export const createCampaign = async (
  data: Record<string, any>
): Promise<normalAPIResponse> => {
  try {
    const res = await api.post(
      `${BACKEND_URL}/notification-campaign/create`,
      data,
      { withCredentials: true }
    );
    return res.data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Internal Server Error",
    };
  }
};

export const updateCampaign = async (
  campaignId: string,
  data: Record<string, any>
): Promise<normalAPIResponse> => {
  try {
    const res = await api.put(
      `${BACKEND_URL}/notification-campaign/${campaignId}`,
      data,
      { withCredentials: true }
    );
    return res.data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Internal Server Error",
    };
  }
};

export const deleteCampaign = async (
  campaignId: string
): Promise<normalAPIResponse> => {
  try {
    const res = await api.delete(
      `${BACKEND_URL}/notification-campaign/${campaignId}`,
      { withCredentials: true }
    );
    return res.data;
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Internal Server Error",
    };
  }
};
