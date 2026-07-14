"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Listens globally for online/offline browser events.
 * - Offline → redirects to /offline
 * - Back online on /offline → goes back to previous page
 */
export default function NetworkGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If the page loads and we're already offline, redirect immediately
    if (!navigator.onLine && pathname !== "/offline") {
      router.replace("/offline");
    }

    const handleOffline = () => {
      if (pathname !== "/offline") {
        router.replace("/offline");
      }
    };

    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("offline", handleOffline);
    };
  }, [router, pathname]);

  return null;
}
