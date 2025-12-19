"use client";


import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Icon } from "@iconify/react";


export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 px-4">
      <Card className="w-full max-w-md shadow-xl rounded-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-emerald-600">
            Verify OTP
          </CardTitle>
          <p className="text-sm text-muted-foreground">
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
                className="text-center text-lg font-semibold"
              />
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">New Password</label>
            <div className="relative">
              <span className="icon-[mdi-light--lock-reset] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl"></span>
              <Input type="password" placeholder="New password" className="pl-10" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm Password</label>
            <div className="relative">
              <span className="icon-[mdi-light--lock-check] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl"></span>
              <Input type="password" placeholder="Confirm password" className="pl-10" />
            </div>
          </div>

          <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
            Reset Password
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Didn’t receive OTP?{" "}
            <button className="text-emerald-600 hover:underline">
              Resend OTP
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

