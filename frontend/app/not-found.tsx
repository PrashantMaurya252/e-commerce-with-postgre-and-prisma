import Link from "next/link";

export default function NotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold">404 - Page Not Found</h1>

      <Link href="/user/home" className="mt-4 text-blue-600">
        Go to Home
      </Link>
    </div>
  );
}
