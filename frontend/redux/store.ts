import { configureStore } from "@reduxjs/toolkit";
import authReducer from './slices/authSlice'
import { cartApi } from "./services/cartApi";
import { wishlistApi } from "./services/wishlistApi";


export const store = configureStore({
    reducer:{
        auth:authReducer,
        [cartApi.reducerPath]:cartApi.reducer,
        [wishlistApi.reducerPath]:wishlistApi.reducer
    },
    middleware:(getDefaultMiddleWare)=>getDefaultMiddleWare().concat(cartApi.middleware, wishlistApi.middleware)
})

export type RootState = ReturnType <typeof store.getState>
export type AppDispatch = typeof store.dispatch