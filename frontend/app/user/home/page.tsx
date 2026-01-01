'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import BannerCarousel from "@/components/home/BannerCarousel";
import { fetchAllProducts } from "@/utils/api";
import { getProductImage } from "@/utils/product";

export default function Home() {
  const router = useRouter();

  const [featured, setFeatured] = useState<any[]>([]);
  const [electronics, setElectronics] = useState<any[]>([]);
  const [fashion, setFashion] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* -------------------- Fetch Products -------------------- */
  useEffect(() => {
    const loadHomeProducts = async () => {
      setLoading(true);

      const [featuredRes, electronicsRes, fashionRes] = await Promise.all([
        fetchAllProducts({ page: 1, limit: 8 }),
        fetchAllProducts({ category: "ELECTRONICS", page: 1, limit: 8 }),
        fetchAllProducts({ category: "CLOTHES", page: 1, limit: 8 }),
      ]);

      const mapProducts = (res: any) =>
        res?.success
          ? res.data.map((p: any) => ({
              id: p.id,
              name: p.title,
              price: p.isOfferActive ? p.offerPrice : p.price,
              image: getProductImage(p.files),
            }))
          : [];

      setFeatured(mapProducts(featuredRes));
      setElectronics(mapProducts(electronicsRes));
      setFashion(mapProducts(fashionRes));

      setTimeout(() => setLoading(false), 300); // smooth skeleton UX
    };

    loadHomeProducts();
  }, []);

  /* -------------------- Skeleton Card -------------------- */
  const SkeletonCard = () => (
    <div className="border rounded-lg p-3 space-y-3 animate-pulse">
      <div className="h-32 bg-muted rounded bg-gray-400" />
      <div className="h-4 bg-muted rounded w-3/4 bg-gray-400" />
      <div className="h-4 bg-muted rounded w-1/2 bg-gray-400" />
    </div>
  );

  /* -------------------- Product Grid -------------------- */
  const ProductGrid = ({ products }: { products: any[] }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
      {loading
        ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
        : products.map((p) => (
            <div
              key={p.id}
              onClick={() => router.push("/user/products")}
              className="cursor-pointer border rounded-lg p-3 hover:shadow-md transition"
            >
              <img
                src={p.image}
                alt={p.name}
                className="h-32 w-full object-contain mb-3"
              />
              <h3 className="text-sm font-medium truncate">{p.name}</h3>
              <p className="font-semibold mt-1">₹{p.price}</p>
            </div>
          ))}
    </div>
  );

  /* -------------------- UI -------------------- */
  return (
    <main className="max-w-7xl mx-auto px-4">
      {/* Banner */}
      <BannerCarousel />

      {/* Hero Section */}
      <section className="py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">
          Everything You Need, One Click Away
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
          Explore electronics, fashion, and daily essentials at the best prices
          across India.
        </p>

        <button
          onClick={() => router.push("/user/products")}
          className="px-8 py-3 bg-primary text-white rounded-lg font-medium hover:opacity-90"
        >
          Browse All Products
        </button>
      </section>

      {/* Featured */}
      <section className="py-12">
        <h2 className="text-2xl font-semibold mb-6">Featured Products</h2>
        <ProductGrid products={featured} />
      </section>

      {/* Electronics */}
      <section className="py-12">
        <h2 className="text-2xl font-semibold mb-6">Electronics</h2>
        <ProductGrid products={electronics} />
      </section>

      {/* Fashion */}
      <section className="py-12">
        <h2 className="text-2xl font-semibold mb-6">Fashion</h2>
        <ProductGrid products={fashion} />
      </section>

      {/* Footer */}
      <footer className="border-t mt-20 py-12 text-sm text-muted-foreground">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-semibold text-foreground mb-3">About ShopNow</h4>
            <p>
              ShopNow is a trusted Indian e-commerce platform delivering quality
              products at affordable prices.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3">Customer Care</h4>
            <ul className="space-y-2">
              <li>Help Center</li>
              <li>Returns & Refunds</li>
              <li>Shipping Info</li>
              <li>Secure Payments</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3">Company</h4>
            <ul className="space-y-2">
              <li>About Us</li>
              <li>Careers</li>
              <li>Privacy Policy</li>
              <li>Terms & Conditions</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3">Contact</h4>
            <p>Email: support@shopnow.in</p>
            <p>Phone: +91 90000 12345</p>
            <p>Bengaluru, Karnataka, India</p>
          </div>
        </div>

        <p className="text-center mt-10">
          © 2025 ShopNow Pvt Ltd. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
