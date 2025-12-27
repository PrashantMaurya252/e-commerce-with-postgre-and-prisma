import { logout, updateAccessToken } from "@/redux/slices/authSlice";
import { store } from "@/redux/store";
import axios from "axios"



const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

const api = axios.create({
    baseURL:BACKEND_URL,
    withCredentials:true
})

api.interceptors.request.use((config)=>{
    const state = store.getState()
    const token = state.auth.accessToken

    if(token){
        config.headers.Authorization = `${token}`
    }

    return config
})

api.interceptors.response.use((response)=>response,async(error)=>{
    const originalRequest = error.config
    if(error?.response?.status === 401 && !originalRequest._retry){
        originalRequest._retry = true

        try {
            const res = await api.post(`/auth/refresh-token`)
            const newAccessToken = await res.data.accessToken
            store.dispatch(updateAccessToken(newAccessToken))
            originalRequest.headers.Authorization = `${newAccessToken}`
            return api(originalRequest)
        } catch (err) {
            store.dispatch(logout())
        }
    }
    return Promise.reject(error)
})


export default api