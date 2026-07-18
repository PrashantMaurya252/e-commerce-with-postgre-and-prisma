"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { googleLogin, loginAPI } from "@/utils/api";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { login } from "@/redux/slices/authSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { GoogleLogin } from "@react-oauth/google";
import { ShoppingBag, X } from "lucide-react";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [formError, setFormError] = useState({
    email: "",
    password: "",
  });
  const router = useRouter();
  const {user,isAuthenticated,accessToken} = useAppSelector((state:RootState)=>state.auth)
  const [showDemoModal, setShowDemoModal] = useState(true);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      let hasError = false;
      for (const [key, value] of Object.entries(formData)) {
        if (value.trim() === "") {
          setFormError((prev) => ({
            ...prev,
            [key]: `${key} is required field`,
          }));
          hasError = true;
        } else {
          setFormError((prev) => ({
            ...prev,
            [key]: "",
          }));
        }
      }

      if (hasError) return;

      const response = await loginAPI(formData);
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
      console.error("login submit error", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name;
    const value = e.target.value;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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

  const handleDemoLogin = async (role: "ADMIN" | "USER") => {
    setShowDemoModal(false);
    const email = role === "ADMIN" ? "admin@gmail.com" : "user@gmail.com";
    const password = "12345678";
    
    // Auto fill for visual feedback but password will be hidden by type="password"
    setFormData({ email, password });

    // Auto submit
    try {
      setLoading(true);
      const response = await loginAPI({ email, password });
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
        toast.success(`Logged in as ${role === 'ADMIN' ? 'Admin' : 'User'}`);
      } else {
        toast.error(response?.message || "Something went wrong while login");
      }
    } catch (error) {
      console.error("demo login submit error", error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] relative overflow-hidden px-4">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>

      <Card className="w-full max-w-md glass shadow-2xl rounded-3xl relative z-10 p-2 sm:p-4">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center mb-2">
            <div className="bg-primary text-white p-3 rounded-2xl shadow-lg shadow-primary/30">
              <ShoppingBag size={32} strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-black text-[var(--foreground)] tracking-tight">
              Welcome Back
            </CardTitle>
            <p className="text-sm text-[var(--foreground-muted)] mt-1 font-medium">Login to your DesiMarket account</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-[var(--foreground)]">Email Address</label>
            <div className="relative">
              <span className="icon-[mdi-light--email] absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] text-xl"></span>
              <Input
                type="email"
                name="email"
                placeholder="you@example.com"
                className="pl-11 bg-[var(--surface)] border-[var(--border)] focus:border-primary focus:ring-primary/20 h-12 rounded-xl transition-all text-[var(--foreground)]"
                onChange={(e) => handleChange(e)}
              />
            </div>
            {formError?.email?.trim() !== "" && (
              <p className="text-rose-500 font-medium text-xs mt-1 px-1">
                {formError?.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-[var(--foreground)]">Password</label>
              <Link
                href="/auth/forgot-password"
                className="text-primary hover:text-primary-hover hover:underline text-xs font-semibold transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <span className="icon-[mdi-light--lock] absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] text-xl"></span>
              <Input
                type="password"
                placeholder="••••••••"
                className="pl-11 bg-[var(--surface)] border-[var(--border)] focus:border-primary focus:ring-primary/20 h-12 rounded-xl transition-all text-[var(--foreground)]"
                name="password"
                onChange={(e) => handleChange(e)}
              />
            </div>
            {formError?.password?.trim() !== "" && (
              <p className="text-rose-500 font-medium text-xs mt-1 px-1">
                {formError?.password}
              </p>
            )}
          </div>

          <Button
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-white h-12 rounded-xl font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98]"
            onClick={handleSubmit}
          >
            {loading ? "Authenticating..." : "Login to Account"}
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
              onError={() => toast.error("Google Login Failed")}
              theme="outline"
              size="large"
              shape="rectangular"
              text="continue_with"
            />
          </div>

          <p className="text-center text-sm text-[var(--foreground-muted)] font-medium pt-2">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-primary hover:text-primary-hover font-bold hover:underline transition-colors">
              Sign up today
            </Link>
          </p>
        </CardContent>
      </Card>

      {/* Demo Credentials Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowDemoModal(false)}
              className="absolute top-4 right-4 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-black mb-2 text-center text-[var(--foreground)]">Demo Access</h2>
            <p className="text-sm text-center text-[var(--foreground-muted)] mb-6">
              This is a demo project. Select a role below to automatically log in.
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => handleDemoLogin("ADMIN")}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-xl font-bold shadow-lg shadow-emerald-600/20"
              >
                Login as Admin
              </Button>
              <Button 
                onClick={() => handleDemoLogin("USER")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl font-bold shadow-lg shadow-blue-600/20"
              >
                Login as User
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
