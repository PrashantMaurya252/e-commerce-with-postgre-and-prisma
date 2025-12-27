import { useAppDispatch } from "@/redux/hooks";
import { fetchMe } from "@/redux/thunks/authThunk";
import { useEffect } from "react";



export default function AuthInitializer({children}:{children:React.ReactNode}){
    const dispatch = useAppDispatch()

    useEffect(()=>{
        refresh
        dispatch(fetchMe())
    },[dispatch])

    return children
}