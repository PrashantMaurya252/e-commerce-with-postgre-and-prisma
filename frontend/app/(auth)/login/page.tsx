"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { loginAPI } from "@/utils/api";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { login } from "@/redux/slices/authSlice";

// import { Icon } from "@iconify/react";

export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
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
            token: response.data.token,
          })
        );
        router.push("/user/home");
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
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 px-4">
      <Card className="w-full max-w-md shadow-xl rounded-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-orange-600">
            Desi Market
          </CardTitle>
          <p className="text-sm text-muted-foreground">Login to your account</p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <div className="relative">
              <span className="icon-[mdi-light--email] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl"></span>
              <Input
                type="email"
                name="email"
                placeholder="you@example.com"
                className="pl-10"
                onChange={(e) => handleChange(e)}
              />
            </div>
            <p className="text-red-600 font-semibold text-sm">
              {formError?.email?.trim() !== "" && formError?.email}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <span className="icon-[mdi-light--lock] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl"></span>
              <Input
                type="password"
                placeholder="••••••••"
                className="pl-10"
                name="password"
                onChange={(e) => handleChange(e)}
              />
            </div>
            <p className="text-red-600 font-semibold text-sm">
              {formError?.password?.trim() !== "" && formError?.password}
            </p>
          </div>

          <div className="flex justify-between items-center text-sm">
            <Link
              href="/forgot-password"
              className="text-orange-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700"
            onClick={handleSubmit}
          >
            {loading ? "...Loading" : "Login"}
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
