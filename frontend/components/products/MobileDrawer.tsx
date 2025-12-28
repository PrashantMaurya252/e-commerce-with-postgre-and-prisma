// components/products/MobileFilterDrawer.tsx
"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import ProductFilters from "./ProductFilters";
import FilterSkeleton from "./FilterSkeleton";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
  filtersProps: any;
}

export default function MobileFilterDrawer({
  open,
  onOpenChange,
  isLoading,
  filtersProps,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[90%] sm:w-[360px]">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          {isLoading ? (
            <FilterSkeleton />
          ) : (
            <ProductFilters {...filtersProps} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
