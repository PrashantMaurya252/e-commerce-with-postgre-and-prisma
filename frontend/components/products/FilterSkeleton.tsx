// components/products/FilterSkeleton.tsx
export default function FilterSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 bg-muted rounded" />

      <div className="space-y-3">
        <div className="h-4 w-1/2 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
      </div>

      <div className="space-y-3">
        <div className="h-4 w-1/3 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
      </div>

      <div className="space-y-3">
        <div className="h-4 w-1/4 bg-muted rounded" />
        <div className="h-2 bg-muted rounded" />
      </div>
    </div>
  );
}
