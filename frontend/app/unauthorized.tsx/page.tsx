"use client";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="h-screen flex flex-col items-center justify-center text-center">
      <h1 className="text-3xl font-bold text-red-600">403 - Unauthorized</h1>
      <p className="mt-2">You do not have permission to access this page.</p>

      <Link
        href="/user/home"
        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded"
      >
        Go to Home
      </Link>
    </div>
  );
}
