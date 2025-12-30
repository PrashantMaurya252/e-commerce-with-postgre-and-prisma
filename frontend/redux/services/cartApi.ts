import {createApi,fetchBaseQuery} from "@reduxjs/toolkit/query/react"
import { BACKEND_URL } from "@/utils/api"
import { headers } from "next/headers"

export const cartApi = createApi({
    reducerPath:"cartApi",
    baseQuery:fetchBaseQuery({
        baseUrl:BACKEND_URL,
        prepareHeaders:(headers,{getState})=>{
            const token = (getState() as any).auth.accessToken
            if(token){
                headers.set("authorization",`Bearer ${token}`)
            }
            return headers
            
        },
    }),
    tagTypes:["Cart"],
    endpoints:(builder)=>({
        getCartItems:builder.query<any,void>({
            query:()=>"/cart/cartItems",
            providesTags:["Cart"]
        }),
        addToCart:builder.mutation<any,string>({
            query:(productId)=>({
                url:`/cart/add-to-cart/${productId}`,
                method:"POST"
            }),
            invalidatesTags:["Cart"]
        }),
        decreaseFromCart:builder.mutation<any,string>({
            query:(productId)=>({
                url:`/cart/decrease-from-cart/${productId}`,
                method:"POST"
            }),
            invalidatesTags:["Cart"]
        }),
        deleteFromCart:builder.mutation<any,string>({
            query:(productId)=>({
                url:`/cart/delete-cart-item/${productId}`,
                method:"POST"
            }),
            invalidatesTags:["Cart"]
        })
    })
})

export const {useGetCartItemsQuery,useAddToCartMutation,useDecreaseFromCartMutation,useDeleteFromCartMutation} = cartApi