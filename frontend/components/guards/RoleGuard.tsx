"use client";
import { useAppSelector } from "@/redux/hooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Role = "ADMIN" | "USER";

export default function RoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: Role[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);

  const role: Role | null = user
    ? user.isAdmin
      ? "ADMIN"
      : "USER"
    : null;

  useEffect(() => {
    if (role && !allowedRoles.includes(role)) {
      router.replace("/unauthorized");
    }
  }, [role, allowedRoles, router]);

  if (!role || !allowedRoles.includes(role)) return null;

  return <>{children}</>;
}
