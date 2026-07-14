"use client";


import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { sendForgotPasswordOtpToEmail } from "@/utils/api";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
// import { Icon } from "@iconify/react";

export default function ForgotPasswordPage() {
  const [email,setEmail] = useState("")
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const sendForgotPasswordOtp = async()=>{
    try {
      if(email.trim() === ""){
        toast.error("Email is required")
        return
      }
      setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden px-4">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>

      <Card className="w-full max-w-md glass shadow-2xl rounded-3xl border border-white/50 relative z-10 p-2 sm:p-4">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center mb-2">
            <div className="bg-primary text-white p-3 rounded-2xl shadow-lg shadow-primary/30">
              <KeyRound size={32} strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">
              Forgot Password
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Enter your registered email to receive OTP
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Email Address</label>
            <div className="relative">
              <span className="icon-[mdi-light--email] absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl"></span>
              <Input 
                onChange={(e)=>setEmail(e.target.value.trim())} 
                value={email} 
                type="email" 
                placeholder="you@example.com" 
                className="pl-11 bg-white/50 border-slate-200 focus:border-primary focus:ring-primary/20 h-12 rounded-xl transition-all" 
              />
            </div>
          </div>

          <Button 
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-white h-12 rounded-xl font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98]" 
            onClick={sendForgotPasswordOtp}
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </Button>

          <p className="text-center text-sm text-slate-500 font-medium pt-2">
            Remember your password?{" "}
            <Link href="/auth/login" className="text-primary hover:text-primary-hover font-bold hover:underline transition-colors">
              Login here
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}