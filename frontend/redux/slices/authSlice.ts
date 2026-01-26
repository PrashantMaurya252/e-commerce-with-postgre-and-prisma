import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchMe, refreshMe } from "../thunks/authThunk";
import api from "@/utils/interceptor";




export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin:boolean
  
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  authInitialized:boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  authInitialized:false
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (
      state,
      action: PayloadAction<{ user: User; accessToken: string }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true; 
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
    },

    updateAccessToken:(state,action:PayloadAction<string>)=>{
      state.accessToken = action.payload
    },

    
    

  },
  extraReducers:(builder)=>{
      builder.addCase(fetchMe.fulfilled,(state,action)=>{
        state.user = action.payload
        state.isAuthenticated = true
      })
      builder.addCase(fetchMe.rejected,(state)=>{
        state.user = null,
        state.isAuthenticated = false
      })
      builder.addCase(refreshMe.fulfilled,(state,action)=>{
        state.accessToken = action.payload
        state.isAuthenticated = true
        state.authInitialized = true
        api.defaults.headers.common["Authorization"] = `Bearer ${action.payload}`
      })
      builder.addCase(refreshMe.rejected,(state)=>{
        state.accessToken=null
        state.isAuthenticated = false
        state.authInitialized = true
      })
    }
});

export const { login, logout,updateAccessToken } = authSlice.actions;
export default authSlice.reducer;
