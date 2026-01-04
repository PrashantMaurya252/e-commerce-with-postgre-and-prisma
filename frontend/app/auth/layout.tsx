"use client"

import { useAppSelector } from "@/redux/hooks";
import { RootState } from "@/redux/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated } = useAppSelector(
    (state: RootState) => state.auth
  );
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.isAdmin) {
        router.push("/admin/dashboard");
      } else {
        router.push("/user/home");
      }
    }
  }, [isAuthenticated, user, router]);

  return <>{children}</>;
}
