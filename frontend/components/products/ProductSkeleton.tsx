// components/products/ProductSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-40 w-full rounded-lg bg-gray-400" />
          <Skeleton className="h-4 w-3/4  bg-gray-400" />
          <Skeleton className="h-4 w-1/2  bg-gray-400" />
        </div>
      ))}
    </div>
  );
}
