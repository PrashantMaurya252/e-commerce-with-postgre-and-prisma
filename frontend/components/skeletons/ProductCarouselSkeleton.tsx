import ProductSkeleton from "./ProductSkeleton";

export default function ProductCarouselSkeleton() {
  return (
    <div className="mt-10">
      <div className="h-6 w-40 bg-gray-200 rounded mb-4 animate-pulse" />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
