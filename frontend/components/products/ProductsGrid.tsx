import ProductCard from "./ProductCard";
import { Product } from "@/types/product";

export default function ProductsGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-10">
        No products found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
