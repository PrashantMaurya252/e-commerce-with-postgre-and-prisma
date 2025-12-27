"use client"

import { useAppSelector } from "@/redux/hooks";
import { RootState } from "@/redux/store";
import { useRouter } from "next/navigation";



export default function Home() {

  const {isAuthenticated} = useAppSelector((state:RootState)=>state.auth)
  const router = useRouter()
  if(!isAuthenticated){
    router.push("/auth/login")
    return
  }

  
  return (
    <div>Home <span className="icon-[mdi-light--home]"></span></div>
  );
}
