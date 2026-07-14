"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: {
      x: number;
      y: number;
      r: number;
      dx: number;
      dy: number;
      alpha: number;
    }[] = [];

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
        dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.5 + 0.1,
      });
    }

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(239, 68, 68, ${p.alpha})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden px-4">
      {/* Animated background */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-orange-500/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 text-center max-w-lg">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-rose-500/20 blur-2xl scale-150" />
            <div className="relative bg-rose-500/15 border border-rose-500/30 p-6 rounded-2xl">
              <AlertTriangle size={52} className="text-rose-400" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Error code */}
        <div className="text-[7rem] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-rose-400 to-rose-700 select-none mb-2">
          500
        </div>

        <h1 className="text-2xl font-black text-white mb-3 tracking-tight">
          Something Went Wrong
        </h1>

        <p className="text-slate-400 text-sm leading-relaxed mb-2">
          An unexpected error occurred on our end. Our team has been notified
          and is working on a fix.
        </p>

        {error?.digest && (
          <p className="text-xs text-slate-600 font-mono mb-8">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <button
            onClick={reset}
            className="flex items-center gap-2.5 px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 active:scale-95 w-full sm:w-auto justify-center"
          >
            <RefreshCw size={16} />
            Try Again
          </button>

          <Link
            href="/"
            className="flex items-center gap-2.5 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white font-bold rounded-xl text-sm transition-all active:scale-95 w-full sm:w-auto justify-center"
          >
            <Home size={16} />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
