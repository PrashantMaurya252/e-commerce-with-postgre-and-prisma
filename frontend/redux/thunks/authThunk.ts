import { meAPI } from "@/utils/api";
import { createAsyncThunk } from "@reduxjs/toolkit";


export const fetchMe = createAsyncThunk("/auth/me",
    async ()=>{
        const res = await meAPI()
        return res.user
    }
)