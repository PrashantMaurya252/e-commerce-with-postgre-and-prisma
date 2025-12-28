"use client";

import Image from "next/image";
import { useState } from "react";
import { Product } from "@/types/product";
import { useRouter } from "next/navigation";

export default function ProductCard({ product }: { product: Product }) {
  const [added, setAdded] = useState(false);
  const router = useRouter()

  const handleAdd = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 600);
    // dispatch(addToCart(product)) ← later
  };

  return (
    <div
      className={`border rounded-xl p-4 transition relative
      ${added ? "scale-105 ring-2 ring-orange-500" : "hover:shadow-lg"}`}
    >
      <div className="relative h-40 mb-3">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover rounded-lg"
        />
      </div>

      <h3 className="font-medium text-sm">{product.name}</h3>
      <p className="text-orange-600 font-semibold">₹{product.price}</p>

      <button
        onClick={handleAdd}
        className="mt-2 w-full bg-orange-600 text-white py-2 rounded-md text-sm hover:bg-orange-700 cursor-pointer"
      >
        {added ? "Added ✓" : "Add to Cart"}
      </button>

      {/* Floating animation badge */}
      {added && (
        <span className="absolute top-2 right-2 text-xs bg-orange-600 text-white px-2 py-1 rounded-full animate-bounce">
          Added
        </span>
      )}

      <span
        onClick={()=>router.push(`/user/products/${product.id}`)}
        className="text-sm font-semibold mt-2 self-center cursor-pointer"
      >
        Click Here to see Details
      </span>
    </div>
  );
}
