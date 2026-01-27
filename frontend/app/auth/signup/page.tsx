"use client";


import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signupAPI } from "@/utils/api";
// import { Icon } from "@iconify/react";


export default function SignupPage() {
  const [formData,setFormData] = useState({
    username:"",
    email:"",
    password:""
  })
  const [formError,setFormError] = useState({
    username:"",
    email:"",
    password:""
  })

  const [loading,setLoading] = useState(false)
  const router = useRouter()
  const handleChange = (e:React.ChangeEvent<HTMLInputElement>)=>{
    try {
      const name = e.target.name
      const value = e.target.value
      setFormData((prev)=>({
        ...prev,
        [name]:value
      }))
    } catch (error) {
      console.error("Handle Change Error",error)
    }
  }
  const handleSignup = async()=>{
    for(const [key,value] of Object.entries(formData)){
      if(value.trim() === ""){
        toast.error(`${key} must not be empty`)
        return
      }
    }
    try {
      const response = await signupAPI(formData)
      if(response.success){
        toast.success("Signup Successful")
        router.push("/auth/login")
      }else{
        toast.error(response.message)
      }
    } catch (error) {
      console.error("Handle signup error",error)
      toast.error("Internal Server Error")
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4">
      <Card className="w-full max-w-md shadow-xl rounded-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-emerald-600">
            Desi Market
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Create your account
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <div className="relative">
              <span className="icon-[mdi-light--account] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl"></span>
              <Input name="username" value={formData.username} placeholder="Your name" className="pl-10" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <div className="relative">
              <span className="icon-[mdi-light--email] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl"></span>
              <Input name="email" value={formData.username} type="email" placeholder="you@example.com" className="pl-10" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <span className="icon-[mdi-light--lock] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl"></span>
              <Input name="password" value={formData.password} type="password" placeholder="Create password" className="pl-10" />
            </div>
          </div>

          <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
            Sign Up
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-600 hover:underline">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
