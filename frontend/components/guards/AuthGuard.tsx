"use client";
import { useAppSelector } from "@/redux/hooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated,authInitialized } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!authInitialized) return;

    if (!isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isAuthenticated, authInitialized, router]);

  if (!authInitialized) return null;
  if (!isAuthenticated) return null;

  return <>{children}</>;
}
