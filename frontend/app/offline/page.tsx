"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WifiOff, RefreshCw, Wifi } from "lucide-react";

export default function OfflinePage() {
  const router = useRouter();
  const [reconnecting, setReconnecting] = useState(false);
  const [dots, setDots] = useState(".");

  // Animate dots for "Checking connection..."
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Auto-redirect when back online
  useEffect(() => {
    const handleOnline = () => {
      setReconnecting(true);
      setTimeout(() => router.back(), 1200);
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [router]);

  const handleRetry = () => {
    if (navigator.onLine) {
      setReconnecting(true);
      setTimeout(() => router.back(), 800);
    } else {
      // Force a reload attempt
      window.location.reload();
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden px-4">
      {/* Pulsing glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full bg-slate-800/30 blur-[150px] animate-pulse" />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 text-center max-w-md">
        {/* Icon with animated rings */}
        <div className="flex justify-center mb-10">
          <div className="relative">
            {/* Outer rings */}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="absolute inset-0 rounded-full border border-slate-700/60"
                style={{
                  transform: `scale(${1 + i * 0.5})`,
                  opacity: 1 - i * 0.25,
                  animation: `ping 2s cubic-bezier(0,0,0.2,1) infinite`,
                  animationDelay: `${i * 0.4}s`,
                }}
              />
            ))}
            <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
              {reconnecting ? (
                <Wifi size={48} className="text-emerald-400" strokeWidth={1.5} />
              ) : (
                <WifiOff size={48} className="text-slate-400" strokeWidth={1.5} />
              )}
            </div>
          </div>
        </div>

        {reconnecting ? (
          <>
            <h1 className="text-2xl font-black text-white mb-3 tracking-tight">
              Back Online!
            </h1>
            <p className="text-emerald-400 text-sm font-semibold mb-2">
              Connection restored. Redirecting you back{dots}
            </p>
            <div className="mt-6 flex justify-center">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-emerald-400"
                    style={{
                      animation: "bounce 0.8s infinite",
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-4 tracking-tight">
              You&apos;re Offline
            </h1>

            <p className="text-slate-400 text-sm leading-relaxed mb-10 max-w-xs mx-auto">
              No internet connection detected. Check your Wi-Fi or mobile data
              and try again.
            </p>

            {/* Tips */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-8 text-left space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                Things to try
              </p>
              {[
                "Check if your Wi-Fi is turned on",
                "Move closer to your router",
                "Disable and re-enable airplane mode",
                "Restart your router or modem",
              ].map((tip, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-slate-500">
                      {i + 1}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">{tip}</p>
                </div>
              ))}
            </div>

            <button
              onClick={handleRetry}
              className="flex items-center gap-2.5 px-8 py-3.5 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl text-sm transition-all active:scale-95 shadow-lg mx-auto"
            >
              <RefreshCw size={16} />
              Try Again
            </button>

            <p className="text-xs text-slate-600 mt-6">
              This page will automatically reload when connection is restored
            </p>
          </>
        )}
      </div>
    </div>
  );
}
