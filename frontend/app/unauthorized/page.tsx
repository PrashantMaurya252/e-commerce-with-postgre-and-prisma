"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldX, ArrowLeft, Home, LogIn } from "lucide-react";
import { useAppSelector } from "@/redux/hooks";

export default function UnauthorizedPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const homeRoute = user?.isAdmin ? "/admin/dashboard" : "/user/home";

  return (
    <div className="relative min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden px-4">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-amber-500/6 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative z-10 text-center max-w-lg">
        {/* Shield Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-amber-500/15 blur-3xl scale-150" />
            <div className="relative bg-amber-500/10 border border-amber-500/25 p-6 rounded-2xl">
              <ShieldX size={52} className="text-amber-400" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Code */}
        <div className="text-[7rem] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-amber-400 to-amber-700 select-none mb-2">
          403
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white mb-4 tracking-tight">
          Access Denied
        </h1>

        <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-3 max-w-sm mx-auto">
          You don&apos;t have permission to view this page. This area requires
          special privileges.
        </p>

        {/* Context-aware hint */}
        {!isAuthenticated && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
            <LogIn size={14} />
            You need to be logged in to access this page
          </div>
        )}

        {isAuthenticated && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-8">
            <ShieldX size={14} />
            Your account role doesn&apos;t allow access here
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-2">
          {isAuthenticated ? (
            <Link
              href={homeRoute}
              className="flex items-center gap-2.5 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-95 w-full sm:w-auto justify-center"
            >
              <Home size={16} />
              Go to Dashboard
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-2.5 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-95 w-full sm:w-auto justify-center"
            >
              <LogIn size={16} />
              Sign In
            </Link>
          )}

          <button
            onClick={() => router.back()}
            className="flex items-center gap-2.5 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white font-bold rounded-xl text-sm transition-all active:scale-95 w-full sm:w-auto justify-center"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>

        {/* Footer note */}
        <p className="text-xs text-slate-600 mt-10">
          If you think this is a mistake, please contact support.
        </p>
      </div>
    </div>
  );
}
