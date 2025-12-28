import { Skeleton } from "@/components/ui/skeleton"

export default function ProductImageGallerySkeleton() {
  return (
    <div className="flex flex-col-reverse lg:flex-row gap-4">
      
      {/* Thumbnails */}
      <div className="flex lg:flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            className="w-[70px] h-[70px] rounded-md"
          />
        ))}
      </div>

      {/* Main Image */}
      <Skeleton className="w-full lg:w-[420px] aspect-square rounded-lg" />
    </div>
  )
}
