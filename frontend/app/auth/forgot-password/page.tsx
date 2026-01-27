"use client";


import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { sendForgotPasswordOtpToEmail } from "@/utils/api";
import { useRouter } from "next/navigation";
// import { Icon } from "@iconify/react";

export default function ForgotPasswordPage() {
  const [email,setEmail] = useState("")
  const router = useRouter()

  const sendForgotPasswordOtp = async()=>{
    try {
      if(email.trim() === ""){
        toast.error("Email is required")
        return
      }
      const response = await sendForgotPasswordOtpToEmail(email)
      if(response.success){
        toast.success("OTP sent to your Email")
        router.push("/auth/verify-forgot-password")
      }else{
        toast.error(response.message || "Internal Server Error")
      }
    } catch (error) {
      console.error("Send Forgot Password OTP Error",error)
      toast.error("Internal Server Error")
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 px-4">
      <Card className="w-full max-w-md shadow-xl rounded-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-orange-600">
            Forgot Password
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your registered email to receive OTP
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address</label>
            <div className="relative">
              <span className="icon-[mdi-light--email] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl"></span>
              <Input onChange={(e)=>setEmail(e.target.value.trim())} value={email} type="email" placeholder="you@example.com" className="pl-10" />
            </div>
          </div>

          <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={sendForgotPasswordOtp}>
            Send OTP
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link href="/login" className="text-orange-600 hover:underline">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}