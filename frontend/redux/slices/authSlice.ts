import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchMe } from "../thunks/authThunk";




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
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.token;
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
    }
});

export const { login, logout,updateAccessToken } = authSlice.actions;
export default authSlice.reducer;
