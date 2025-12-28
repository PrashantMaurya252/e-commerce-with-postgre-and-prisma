import { Skeleton } from "@/components/ui/skeleton"

export default function ProductDetailsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />

      <div className="flex items-center gap-4 mt-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-6 w-16" />
      </div>

      <Skeleton className="h-4 w-32" />

      <Skeleton className="h-12 w-full md:w-40 mt-6" />
    </div>
  )
}
