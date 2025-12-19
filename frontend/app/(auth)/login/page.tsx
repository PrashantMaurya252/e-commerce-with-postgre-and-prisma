"use client";


import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Icon } from "@iconify/react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 px-4">
      <Card className="w-full max-w-md shadow-xl rounded-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-orange-600">
            Desi Market
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Login to your account
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <div className="relative">
              <span className="icon-[mdi-light--email] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl"></span>
              <Input type="email" placeholder="you@example.com" className="pl-10" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <span className="icon-[mdi-light--lock] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl"></span>
              <Input type="password" placeholder="••••••••" className="pl-10" />
            </div>
          </div>

          <div className="flex justify-between items-center text-sm">
            <Link href="/forgot-password" className="text-orange-600 hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button className="w-full bg-orange-600 hover:bg-orange-700">
            Login
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-orange-600 hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}