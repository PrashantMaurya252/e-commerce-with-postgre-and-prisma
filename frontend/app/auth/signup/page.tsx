"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { googleLogin, signupAPI } from "@/utils/api";
import { GoogleLogin } from "@react-oauth/google";
import { useDispatch } from "react-redux";
import { useAppDispatch } from "@/redux/hooks";
import { login } from "@/redux/slices/authSlice";

export default function SignupPage() {
  const dispatch = useAppDispatch()
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [formError, setFormError] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ==============================
  // Handle Input Change
  // ==============================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFormError((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // ==============================
  // Handle Normal Signup
  // ==============================
  const handleSignup = async () => {
    setLoading(true);

    try {
      let hasError = false;

      for (const [key, value] of Object.entries(formData)) {
        if (value.trim() === "") {
          toast.error(`${key} must not be empty`);
          setFormError((prev) => ({
            ...prev,
            [key]: `${key} is required`,
          }));
          hasError = true;
        }
      }

      if (hasError) {
        setLoading(false);
        return;
      }

      const response = await signupAPI(formData);

      if (response.success) {
        toast.success("Signup Successful");
        router.push("/auth/login");
      } else {
        toast.error(response.message || "Signup failed");
      }
    } catch (error) {
      console.error("Signup error", error);
      toast.error("Internal Server Error");
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // Handle Google Login
  // ==============================
  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);

      const idToken = credentialResponse.credential;

      if (!idToken) {
        toast.error("No ID token received");
        return;
      }

      const response = await googleLogin(idToken);

      if (response.success && response.data) {
              dispatch(
                login({
                  user: response.data.userData,
                  accessToken: response.data.accessToken,
              
                  
                })
              );
              if(response.data.userData.isAdmin){
                router.push("/admin/dashboard");
              }else{
                router.push("/user/home")
              }
      
              toast.success("You logged In Successfully")
            } else {
              toast.error(response?.message || "Something went wrong while login");
            }
    } catch (error) {
      console.error("Google login error", error);
      toast.error("Login Failed");
    } finally {
      setLoading(false);
    }
  };

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
          {/* ================= Full Name ================= */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <Input
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Your name"
            />
            {formError.username && (
              <span className="text-sm text-red-500">
                {formError.username}
              </span>
            )}
          </div>

          {/* ================= Email ================= */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
            />
            {formError.email && (
              <span className="text-sm text-red-500">
                {formError.email}
              </span>
            )}
          </div>

          {/* ================= Password ================= */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create password"
            />
            {formError.password && (
              <span className="text-sm text-red-500">
                {formError.password}
              </span>
            )}
          </div>

          {/* ================= Signup Button ================= */}
          <Button
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSignup}
          >
            {loading ? "Loading..." : "Sign Up"}
          </Button>

          {/* ================= Divider ================= */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-sm text-gray-500">OR</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>

          {/* ================= Google Login ================= */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error("Google Login Failed")}
            />
          </div>

          {/* ================= Login Redirect ================= */}
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-emerald-600 hover:underline">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}