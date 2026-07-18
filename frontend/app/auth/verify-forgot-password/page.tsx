"use client";


import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Icon } from "@iconify/react";


export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] relative overflow-hidden px-4">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>

      <Card className="w-full max-w-md glass shadow-2xl rounded-3xl relative z-10 p-2 sm:p-4">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-black text-[var(--foreground)] tracking-tight">
            Verify OTP
          </CardTitle>
          <p className="text-sm text-[var(--foreground-muted)] font-medium">
            Enter the 6-digit OTP sent to your email
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* OTP INPUTS */}
          <div className="flex justify-between gap-2">
            {[...Array(6)].map((_, i) => (
              <Input
                key={i}
                maxLength={1}
                className="text-center text-lg font-semibold bg-[var(--surface)] border-[var(--border)] focus:border-primary text-[var(--foreground)]"
              />
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[var(--foreground)]">New Password</label>
            <div className="relative">
              <span className="icon-[mdi-light--lock-reset] absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] text-xl"></span>
              <Input type="password" placeholder="New password" className="pl-10 bg-[var(--surface)] border-[var(--border)] focus:border-primary text-[var(--foreground)] h-12 rounded-xl transition-all" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[var(--foreground)]">Confirm Password</label>
            <div className="relative">
              <span className="icon-[mdi-light--lock-check] absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] text-xl"></span>
              <Input type="password" placeholder="Confirm password" className="pl-10 bg-[var(--surface)] border-[var(--border)] focus:border-primary text-[var(--foreground)] h-12 rounded-xl transition-all" />
            </div>
          </div>

          <Button className="w-full bg-primary hover:bg-primary-hover text-white h-12 rounded-xl font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98]">
            Reset Password
          </Button>

          <div className="text-center text-sm text-[var(--foreground-muted)] font-medium">
            Didn’t receive OTP?{" "}
            <button className="text-primary hover:text-primary-hover hover:underline transition-colors font-bold">
              Resend OTP
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

