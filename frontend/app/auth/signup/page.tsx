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
import { useAppDispatch } from "@/redux/hooks";
import { login } from "@/redux/slices/authSlice";
import { ShoppingBag } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] relative overflow-hidden px-4 py-8">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>

      <Card className="w-full max-w-md glass shadow-2xl rounded-3xl relative z-10 p-2 sm:p-4">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center mb-2">
            <div className="bg-primary text-white p-3 rounded-2xl shadow-lg shadow-primary/30">
              <ShoppingBag size={32} strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-black text-[var(--foreground)] tracking-tight">
              Create Account
            </CardTitle>
            <p className="text-sm text-[var(--foreground-muted)] mt-1 font-medium">
              Join DesiMarket today
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* ================= Full Name ================= */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[var(--foreground)]">Full Name</label>
            <Input
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Your name"
              className="bg-[var(--surface)] border-[var(--border)] focus:border-primary focus:ring-primary/20 h-12 rounded-xl transition-all text-[var(--foreground)]"
            />
            {formError.username && (
              <span className="text-xs font-medium text-rose-500 px-1 mt-1 block">
                {formError.username}
              </span>
            )}
          </div>

          {/* ================= Email ================= */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[var(--foreground)]">Email Address</label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="bg-[var(--surface)] border-[var(--border)] focus:border-primary focus:ring-primary/20 h-12 rounded-xl transition-all text-[var(--foreground)]"
            />
            {formError.email && (
              <span className="text-xs font-medium text-rose-500 px-1 mt-1 block">
                {formError.email}
              </span>
            )}
          </div>

          {/* ================= Password ================= */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[var(--foreground)]">Password</label>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create strong password"
              className="bg-[var(--surface)] border-[var(--border)] focus:border-primary focus:ring-primary/20 h-12 rounded-xl transition-all text-[var(--foreground)]"
            />
            {formError.password && (
              <span className="text-xs font-medium text-rose-500 px-1 mt-1 block">
                {formError.password}
              </span>
            )}
          </div>

          {/* ================= Signup Button ================= */}
          <Button
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-white h-12 rounded-xl font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98] mt-2"
            onClick={handleSignup}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </Button>

          {/* ================= Divider ================= */}
          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Or continue with</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          {/* ================= Google Login ================= */}
          <div className="flex justify-center w-full [&>div]:w-full [&>div>div]:w-full [&_iframe]:!w-full shadow-sm hover:shadow-md transition-shadow rounded-xl overflow-hidden">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error("Google Signup Failed")}
              theme="outline"
              size="large"
              shape="rectangular"
              text="continue_with"
            />
          </div>

          {/* ================= Login Redirect ================= */}
          <p className="text-center text-sm text-[var(--foreground-muted)] font-medium pt-2">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary hover:text-primary-hover font-bold hover:underline transition-colors">
              Login here
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}