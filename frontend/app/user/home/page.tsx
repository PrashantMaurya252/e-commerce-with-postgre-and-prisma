'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShoppingBag, Truck, ShieldCheck, CreditCard } from "lucide-react";

import BannerCarousel from "@/components/home/BannerCarousel";
import { fetchAllProducts } from "@/utils/api";
import { getProductImage } from "@/utils/product";
import { useAppSelector } from "@/redux/hooks";
import { toast } from "sonner";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

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

      setTimeout(() => setLoading(false), 500); // smooth skeleton UX
    };

    loadHomeProducts();
  }, []);

  /* -------------------- Skeleton Card -------------------- */
  const SkeletonCard = () => (
    <div className="bg-[var(--card)] rounded-2xl p-4 shadow-sm border border-[var(--border)] flex flex-col h-full">
      <div className="h-40 md:h-48 rounded-xl bg-[var(--surface-2)] animate-shimmer mb-4 w-full" />
      <div className="space-y-3 mt-auto">
        <div className="h-4 rounded bg-[var(--surface-2)] animate-shimmer w-3/4" />
        <div className="h-4 rounded bg-[var(--surface-2)] animate-shimmer w-1/2" />
        <div className="h-5 rounded bg-[var(--surface-2)] animate-shimmer w-1/3 mt-2" />
      </div>
    </div>
  );

  /* -------------------- Product Grid -------------------- */
  const ProductGrid = ({ products }: { products: any[] }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
      {loading
        ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
        : products.map((p) => (
            <div
              key={p.id}
              onClick={() => router.push("/user/products")}
              className="group cursor-pointer bg-[var(--card)] rounded-2xl p-4 border border-[var(--border)] shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 transition-all duration-300 flex flex-col h-full"
            >
              <div className="relative aspect-square w-full mb-4 overflow-hidden rounded-xl bg-white flex items-center justify-center p-4">
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 ease-out"
                />
              </div>
              <div className="mt-auto">
                <h3 className="text-sm md:text-base font-medium text-[var(--foreground)] line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                  {p.name}
                </h3>
                <div className="flex items-center justify-between mt-3">
                  <p className="font-bold text-lg text-[var(--foreground)]">₹{p.price}</p>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if(!isAuthenticated){
                        toast.error("Please login to add items to cart", {
                          action: {
                            label: "Login",
                            onClick: () => router.push("/auth/login"),
                          }
                        });
                      } else {
                        router.push(`/user/products/${p.id}`);
                      }
                    }}
                    className="bg-[var(--surface-2)] hover:bg-primary hover:text-white p-2 rounded-full transition-colors text-[var(--foreground-muted)]">
                    <ShoppingBag size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
    </div>
  );

  /* -------------------- Features Section -------------------- */
  const FeatureBanner = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12 border-t border-b border-slate-100 my-16">
      <div className="flex items-center gap-4 justify-center">
        <div className="bg-primary/10 p-4 rounded-full text-primary">
          <Truck size={28} />
        </div>
        <div>
          <h4 className="font-bold text-slate-900">Free Delivery</h4>
          <p className="text-sm text-slate-500">On all orders over ₹999</p>
        </div>
      </div>
      <div className="flex items-center gap-4 justify-center md:border-l md:border-r border-slate-100">
        <div className="bg-primary/10 p-4 rounded-full text-primary">
          <ShieldCheck size={28} />
        </div>
        <div>
          <h4 className="font-bold text-slate-900">100% Authentic</h4>
          <p className="text-sm text-slate-500">Quality guarantee</p>
        </div>
      </div>
      <div className="flex items-center gap-4 justify-center">
        <div className="bg-primary/10 p-4 rounded-full text-primary">
          <CreditCard size={28} />
        </div>
        <div>
          <h4 className="font-bold text-slate-900">Secure Payments</h4>
          <p className="text-sm text-slate-500">All cards accepted</p>
        </div>
      </div>
    </div>
  )

  /* -------------------- UI -------------------- */
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Banner Section - Wrapped nicely */}
        <div className="pt-6 pb-4">
          <div className="rounded-3xl overflow-hidden shadow-sm">
            <BannerCarousel />
          </div>
        </div>

        {/* Hero Section */}
        <section className="py-20 text-center relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 my-8 shadow-2xl">
          {/* Decorative blur elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary/30 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-50"></div>
          
          <div className="relative z-10 px-6">
            <span className="inline-block py-1 px-3 rounded-full bg-white/10 text-emerald-300 text-sm font-semibold tracking-wider mb-6 border border-white/20 backdrop-blur-md">
              NEW ARRIVALS 2026
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold mb-6 text-white tracking-tight leading-tight">
              Everything You Need, <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                One Click Away.
              </span>
            </h1>
            <p className="text-slate-300 max-w-2xl mx-auto mb-10 text-lg md:text-xl font-light">
              Explore premium electronics, trending fashion, and daily essentials at unbeatable prices across India.
            </p>

            <button
              onClick={() => router.push("/user/products")}
              className="group relative inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
            >
              Start Shopping
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>

        <FeatureBanner />

        {/* Featured */}
        <section className="py-12 animate-fade-in">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-[var(--foreground)] tracking-tight">Featured Products</h2>
              <p className="text-[var(--foreground-muted)] mt-2">Handpicked items just for you</p>
            </div>
            <button onClick={() => router.push("/user/products")} className="hidden md:flex items-center text-primary font-semibold hover:underline">
              View All <ArrowRight size={16} className="ml-1" />
            </button>
          </div>
          <ProductGrid products={featured} />
        </section>

        {/* Electronics */}
        <section className="py-12 animate-fade-in">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-[var(--foreground)] tracking-tight">Latest Electronics</h2>
              <p className="text-[var(--foreground-muted)] mt-2">Upgrade your tech game</p>
            </div>
          </div>
          <ProductGrid products={electronics} />
        </section>

        {/* Fashion */}
        <section className="py-12 animate-fade-in mb-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-[var(--foreground)] tracking-tight">Trending Fashion</h2>
              <p className="text-[var(--foreground-muted)] mt-2">Dress to impress</p>
            </div>
          </div>
          <ProductGrid products={fashion} />
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white mb-6 flex items-center gap-2">
                <ShoppingBag className="text-primary" />
                Desi<span className="text-primary">Market</span>
              </h1>
              <p className="leading-relaxed">
                Your trusted premium e-commerce platform delivering quality products with lightning-fast shipping across India.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Customer Care</h4>
              <ul className="space-y-4">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Returns & Refunds</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Track Order</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Shipping Info</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Company</h4>
              <ul className="space-y-4">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Contact Us</h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-primary">@</div>
                  support@desimarket.in
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-primary">📞</div>
                  +91 90000 12345
                </li>
                <li className="flex items-center gap-3 mt-4 text-sm text-slate-500">
                  Bengaluru, Karnataka, India
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p>© {new Date().getFullYear()} DesiMarket Pvt Ltd. All rights reserved.</p>
            <div className="flex gap-4">
              {/* Social placeholders */}
              <div className="w-10 h-10 rounded-full bg-slate-800 hover:bg-primary transition-colors cursor-pointer"></div>
              <div className="w-10 h-10 rounded-full bg-slate-800 hover:bg-primary transition-colors cursor-pointer"></div>
              <div className="w-10 h-10 rounded-full bg-slate-800 hover:bg-primary transition-colors cursor-pointer"></div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
