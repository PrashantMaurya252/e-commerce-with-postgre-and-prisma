"use client";

import Link from "next/link";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden px-4">
      {/* Animated gradient orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/6 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-600/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 text-center max-w-lg">
        {/* Giant 404 */}
        <div className="relative mb-6 select-none">
          <div className="text-[10rem] sm:text-[12rem] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-slate-700 to-slate-900">
            404
          </div>
          {/* Floating icon over the 404 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
              <Search size={44} className="text-emerald-400" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white mb-4 tracking-tight">
          Page Not Found
        </h1>

        <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-10 max-w-sm mx-auto">
          Looks like this page went on a little adventure and got lost. Let&apos;s
          get you back to familiar territory.
        </p>

        {/* Quick links */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <Link
            href="/user/home"
            className="flex items-center gap-2.5 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-95 w-full sm:w-auto justify-center"
          >
            <Home size={16} />
            Go to Home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2.5 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white font-bold rounded-xl text-sm transition-all active:scale-95 w-full sm:w-auto justify-center"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>

        {/* Helpful links */}
        <div className="border-t border-slate-800/60 pt-8">
          <p className="text-xs text-slate-600 font-semibold uppercase tracking-widest mb-4">
            Popular Pages
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: "Shop Products", href: "/user/products" },
              { label: "My Orders", href: "/user/orders" },
              { label: "My Cart", href: "/user/cart" },
              { label: "Login", href: "/auth/login" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition-all"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
