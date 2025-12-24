import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin:boolean
  
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  isAdmin:boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoggedIn: false,
  isAdmin:false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (
      state,
      action: PayloadAction<{ user: User; token: string,isAdmin:boolean }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isLoggedIn = true;
      state.isLoggedIn = action.payload.isAdmin
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isLoggedIn = false;
      state.isAdmin = false
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
