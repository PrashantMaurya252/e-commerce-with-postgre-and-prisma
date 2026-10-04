"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent, ClipboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { sendForgotPasswordOtpToEmail, verifyForgotPasswordOtp } from "@/utils/api";
import { toast } from "sonner";

type FormData = {
  email: string;
  password: string;
  confirmPassword: string;
};

type FormErrors = {
  email: string;
  otp: string;
  password: string;
  confirmPassword: string;
};

const emptyErrors: FormErrors = {
  email: "",
  otp: "",
  password: "",
  confirmPassword: "",
};

export default function VerifyOtpPage() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [otpDigits, setOtpDigits] = useState<string[]>(
    Array(6).fill("")
  );

  const [errors, setErrors] = useState<FormErrors>(emptyErrors);
  const [resending, setResending] = useState(false);

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    setOtpDigits((previous) =>
      previous.map((digit, position) =>
        position === index ? value : digit
      )
    );

    setErrors((previous) => ({ ...previous, otp: "" }));

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      e.preventDefault();

      setOtpDigits((previous) =>
        previous.map((digit, position) =>
          position === index - 1 ? "" : digit
        )
      );

      otpRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      otpRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (
    e: ClipboardEvent<HTMLInputElement>,
    index: number
  ) => {
    e.preventDefault();

    const pastedDigits = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6 - index);

    if (!pastedDigits) return;

    setOtpDigits((previous) => {
      const next = [...previous];

      pastedDigits.split("").forEach((digit, offset) => {
        next[index + offset] = digit;
      });

      return next;
    });

    setErrors((previous) => ({ ...previous, otp: "" }));

    otpRefs.current[
      Math.min(index + pastedDigits.length, 5)
    ]?.focus();
  };

  const validateForm = () => {
    const nextErrors = { ...emptyErrors };
    const email = formData.email.trim();
    const otp = otpDigits.join("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address";
    }

    if (!/^\d{6}$/.test(otp)) {
      nextErrors.otp = "Enter the complete 6-digit OTP";
    }

    // Match this rule to your backend password policy.
    if (formData.password.length < 8) {
      nextErrors.password = "Password must contain at least 8 characters";
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = "Confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(nextErrors);

    return Object.values(nextErrors).every((message) => !message);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    const payload = {
      email: formData.email.trim(),
      otp: otpDigits.join(""),
      password: formData.password,
    };

    const response = await verifyForgotPasswordOtp({email:formData.email,otp:otpDigits,newPassword:formData.password})

    // Call your reset-password API here with payload.
    // Match the field names to your backend controller.
    // Example:
    // const response = await resetPassword(payload);

    void payload;
    toast.info("Connect your reset-password API to finish this step");
  };

  const handleResendOtp = async () => {
    const email = formData.email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors((previous) => ({
        ...previous,
        email: "Enter a valid email address before resending",
      }));
      return;
    }

    if (resending) return;

    try {
      setResending(true);

      const response = await sendForgotPasswordOtpToEmail(email);

      if (!response.success) {
        throw new Error(response.message || "Could not resend OTP");
      }

      setOtpDigits(Array(6).fill(""));
      setErrors((previous) => ({ ...previous, otp: "" }));
      toast.success(response.message || "OTP resent");
      otpRefs.current[0]?.focus();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not resend OTP"
      );
    } finally {
      setResending(false);
    }
  };

  const inputClass =
    "bg-[var(--surface)] border-[var(--border)] " +
    "focus:border-primary text-[var(--foreground)] h-12 rounded-xl";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] relative overflow-hidden px-4">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70" />

      <Card className="w-full max-w-md glass shadow-2xl rounded-3xl relative z-10 p-2 sm:p-4">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-black text-[var(--foreground)] tracking-tight">
            Verify OTP
          </CardTitle>
          <p className="text-sm text-[var(--foreground-muted)] font-medium">
            Enter the 6-digit OTP sent to your email
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-bold">
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleOnChange}
                placeholder="Your registered email"
                className={inputClass}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-red-500">
                  {errors.email}
                </p>
              )}
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-bold mb-2">OTP</legend>
              <div className="flex justify-between gap-2">
                {otpDigits.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(element) => {
                      otpRefs.current[index] = element;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    maxLength={1}
                    value={digit}
                    onChange={(e) =>
                      handleOtpChange(index, e.currentTarget.value)
                    }
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    onPaste={(e) => handleOtpPaste(e, index)}
                    onFocus={(e) => e.currentTarget.select()}
                    aria-label={`OTP digit ${index + 1}`}
                    aria-invalid={Boolean(errors.otp)}
                    aria-describedby={errors.otp ? "otp-error" : undefined}
                    className={`${inputClass} min-w-0 text-center text-lg font-semibold px-0`}
                  />
                ))}
              </div>
              {errors.otp && (
                <p id="otp-error" className="text-sm text-red-500">
                  {errors.otp}
                </p>
              )}
            </fieldset>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-bold">
                New Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleOnChange}
                placeholder="New password"
                className={inputClass}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
              />
              {errors.password && (
                <p id="password-error" className="text-sm text-red-500">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-bold">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleOnChange}
                placeholder="Confirm password"
                className={inputClass}
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={
                  errors.confirmPassword ? "confirm-password-error" : undefined
                }
              />
              {errors.confirmPassword && (
                <p id="confirm-password-error" className="text-sm text-red-500">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary-hover text-white h-12 rounded-xl font-bold"
            >
              Reset Password
            </Button>

            <div className="text-center text-sm text-[var(--foreground-muted)]">
              Didn’t receive OTP?{" "}
              <button
                type="button"
                disabled={resending}
                onClick={handleResendOtp}
                className="text-primary hover:underline font-bold disabled:opacity-50"
              >
                {resending ? "Resending..." : "Resend OTP"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}