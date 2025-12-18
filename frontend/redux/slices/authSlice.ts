import { createSlice,PayloadAction } from "@reduxjs/toolkit";



interface AuthState{
    user :{
        id:string,
        name:string,
        email:string,
        isAdmin:boolean
    } | null,
    isLoggedIn:boolean
}


const initialState:AuthState ={
    user:null,
    isLoggedIn:false
}

const authSlice = createSlice({
    name:"auth",
    initialState,
    reducers:{
        login:(state,action:PayloadAction<AuthState["user"]>)=>{
            state.user=action.payload,
            state.isLoggedIn=true
        },
        logout:(state)=>{
            state.user=null,
            state.isLoggedIn=false
        }
    }
})


export const {login,logout} = authSlice.actions

export default authSlice.reducer