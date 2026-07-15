import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL as string;

export const wishlistApi = createApi({
  reducerPath: "wishlistApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BACKEND_URL || "http://localhost:8000/api/v1",
  }),
  tagTypes: ["Wishlist"],
  endpoints: (builder) => ({
    getWishlistItems: builder.query<any, void>({
      query: () => ({
        url: "/wishlist",
        method: "GET",
      }),
      providesTags: ["Wishlist"],
    }),

    toggleWishlistItem: builder.mutation<any, string>({
      query: (productId) => ({
        url: `/wishlist/toggle/${productId}`,
        method: "POST",
      }),
      invalidatesTags: ["Wishlist"],
    }),
  }),
});

export const { useGetWishlistItemsQuery, useToggleWishlistItemMutation } = wishlistApi;
