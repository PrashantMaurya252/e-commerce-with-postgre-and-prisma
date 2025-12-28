"use client"

import { useAppSelector } from "@/redux/hooks";
import { RootState } from "@/redux/store";
import { Metadata } from "next";
import { useRouter } from "next/navigation";



export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const {user,isAuthenticated} = useAppSelector((state:RootState)=>state.auth)
  const router = useRouter()

  if(isAuthenticated && user){
    if(user.isAdmin){
       router.push("/admin/dashboard")
    }else{
       router.push("/user/home")
    }
  }
  return <>{children}</>
}
