"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">Something went wrong 😢</h1>

      <button
        onClick={() => reset()}
        className="mt-4 px-6 py-2 bg-black text-white rounded"
      >
        Try Again
      </button>
    </div>
  );
}
