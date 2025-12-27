import { useAppDispatch } from "@/redux/hooks";
import { fetchMe, refreshMe } from "@/redux/thunks/authThunk";
import { useEffect } from "react";



export default function AuthInitializer({children}:{children:React.ReactNode}){
    const dispatch = useAppDispatch()

    useEffect(()=>{

        const initAuth = async()=>{
            const refreshResult = await dispatch(refreshMe())
            if(refreshMe.fulfilled.match(refreshResult)){
                dispatch(fetchMe())
            }
        }
        initAuth()
        
    },[dispatch])

    return children
}