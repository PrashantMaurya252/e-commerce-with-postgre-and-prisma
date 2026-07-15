import { configureStore } from "@reduxjs/toolkit";
import authReducer from './slices/authSlice'
import { cartApi } from "./services/cartApi";
import { wishlistApi } from "./services/wishlistApi";
import { profileApi } from "./services/profileApi";


export const store = configureStore({
    reducer:{
        auth:authReducer,
        [cartApi.reducerPath]:cartApi.reducer,
        [wishlistApi.reducerPath]:wishlistApi.reducer,
        [profileApi.reducerPath]:profileApi.reducer
    },
    middleware:(getDefaultMiddleWare)=>getDefaultMiddleWare().concat(cartApi.middleware, wishlistApi.middleware, profileApi.middleware)
})

export type RootState = ReturnType <typeof store.getState>
export type AppDispatch = typeof store.dispatch