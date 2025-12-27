import { meAPI, refreshAPI } from "@/utils/api";
import { createAsyncThunk } from "@reduxjs/toolkit";


export const fetchMe = createAsyncThunk("/auth/me",
    async ()=>{
        const res = await meAPI()
        return res.user
    }
)

export const refreshMe = createAsyncThunk("/auth/refresh-token",
    async()=>{
        const res = await refreshAPI()
        return res.accessToken
    }
)