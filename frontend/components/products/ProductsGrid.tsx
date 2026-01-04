import ProductCard from "./ProductCard";
import { Product } from "@/types/product";

export default function ProductsGrid({ products,handleProductAddedToCart,handleProductDecreaseFromCart,handleProductDeleteFromCart }: { products: Product[],handleProductAddedToCart:(productId:string)=>void,handleProductDecreaseFromCart:(productId:string)=>void,handleProductDeleteFromCart:(productId:string)=>void }) {
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
        <ProductCard key={product.id} product={product} handleProductAddedToCart={handleProductAddedToCart} handleProductDecreaseFromCart={handleProductDecreaseFromCart} handleProductDeleteFromCart={handleProductDeleteFromCart}/>
      ))}
    </div>
  );
}
