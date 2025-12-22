"use client";

import { useState, useMemo } from "react";
import ProductFilters from "@/components/products/ProductFilters";
// import ProductsGrid from "@/components/products/ProductsGrid";
import { Category, Product } from "@/types/product";
import ProductsGrid from "@/components/products/ProductsGrid";

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Laptop",
    price: 60000,
    category: Category.ELECTRONICS,
    image: "/products/electronics-1.png",
  },
  {
    id: 2,
    name: "Wireless Headphones",
    price: 3000,
    category: Category.ELECTRONICS,
    image: "/products/electronics-2.png",
  },
  {
    id: 3,
    name: "Ethnic Kurta",
    price: 2000,
    category: Category.CLOTHES,
    image: "/products/clothes-1.png",
  },
  {
    id: 4,
    name: "Kitchen Essentials",
    price: 1200,
    category: Category.DAILY_USAGE,
    image: "/products/daily-1.png",
  },
];

export default function Products() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "ALL">("ALL");
  const [price, setPrice] = useState(100000);

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const matchSearch = p.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchCategory =
        category === "ALL" || p.category === category;

      const matchPrice = p.price <= price;

      return matchSearch && matchCategory && matchPrice;
    });
  }, [search, category, price]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">All Products</h1>

      <div className="grid md:grid-cols-[280px_1fr] gap-6">
        <ProductFilters
          search={search}
          setSearch={setSearch}
          category={category}
          setCategory={setCategory}
          price={price}
          setPrice={setPrice}
        />

        <ProductsGrid products={filteredProducts} />
      </div>
    </main>
  );
}
