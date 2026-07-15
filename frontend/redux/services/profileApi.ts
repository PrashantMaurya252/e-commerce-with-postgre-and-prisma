import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL as string;

export const profileApi = createApi({
  reducerPath: "profileApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BACKEND_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.accessToken;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Profile", "Address", "Order", "Review"],
  endpoints: (builder) => ({
    // PROFILE
    getProfile: builder.query<any, string>({
      query: (userId) => `/user/user-profile/${userId}`,
      providesTags: ["Profile", "Address", "Order"],
    }),
    updateProfile: builder.mutation<any, { name?: string; avatar?: string }>({
      query: (data) => ({
        url: `/user/user-profile`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Profile"],
    }),

    // ADDRESS
    addAddress: builder.mutation<any, any>({
      query: (data) => ({
        url: `/user/address`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Address", "Profile"], // Invalidate profile because it fetches addresses too
    }),
    updateAddress: builder.mutation<any, { addressId: string; data: any }>({
      query: ({ addressId, data }) => ({
        url: `/user/address/${addressId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Address", "Profile"],
    }),
    deleteAddress: builder.mutation<any, string>({
      query: (addressId) => ({
        url: `/user/address/${addressId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Address", "Profile"],
    }),

    // ORDERS
    getUserOrders: builder.query<any, void>({
      query: () => `/order/all-orders`,
      providesTags: ["Order"],
    }),

    // REVIEWS
    submitReview: builder.mutation<any, { productId: string; rating: number; comment?: string }>({
      query: ({ productId, rating, comment }) => ({
        url: `/product/review/${productId}`,
        method: "POST",
        body: { rating, comment },
      }),
      invalidatesTags: ["Order", "Profile", "Review"],
    }),
    updateReview: builder.mutation<any, { productId: string; rating: number; comment?: string }>({
      query: ({ productId, rating, comment }) => ({
        url: `/product/review/${productId}`,
        method: "PUT",
        body: { rating, comment },
      }),
      invalidatesTags: ["Order", "Profile", "Review"],
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useGetUserOrdersQuery,
  useSubmitReviewMutation,
  useUpdateReviewMutation,
} = profileApi;
