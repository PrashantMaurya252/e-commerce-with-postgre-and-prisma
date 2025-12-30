import { configureStore } from "@reduxjs/toolkit";
import authReducer from './slices/authSlice'
import { cartApi } from "./services/cartApi";


export const store = configureStore({
    reducer:{
        auth:authReducer,
        [cartApi.reducerPath]:cartApi.reducer
    },
    middleware:(getDefaultMiddleWare)=>getDefaultMiddleWare().concat(cartApi.middleware)
})

export type RootState = ReturnType <typeof store.getState>
export type AppDispatch = typeof store.dispatch