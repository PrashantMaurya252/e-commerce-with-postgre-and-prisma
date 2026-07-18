'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShoppingBag, Truck, ShieldCheck, CreditCard } from "lucide-react";

import StorefrontBanner from "@/components/home/StorefrontBanner";
import ProductsGrid from "@/components/products/ProductsGrid";
import { fetchAllProducts, getAllFaqsAPI, getPublicBannersAPI } from "@/utils/api";
import { getProductImage } from "@/utils/product";
import { useAppSelector } from "@/redux/hooks";
import { toast } from "sonner";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [featured, setFeatured] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [topBanners, setTopBanners] = useState<any[]>([]);
  const [middleBanners, setMiddleBanners] = useState<any[]>([]);
  const [bottomBanners, setBottomBanners] = useState<any[]>([]);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /* -------------------- Fetch Products -------------------- */
  useEffect(() => {
    const loadHomeProducts = async () => {
      setLoading(true);

      const [featuredRes, faqsRes, topRes, midRes, botRes] = await Promise.all([
        fetchAllProducts({ page: 1, limit: 8 }),
        getAllFaqsAPI(),
        getPublicBannersAPI("HOME_TOP", 5),
        getPublicBannersAPI("HOME_MIDDLE", 3),
        getPublicBannersAPI("HOME_BOTTOM", 3),
      ]);

      const mapProducts = (res: any) =>
        res?.success
          ? res.data.map((p: any) => ({
              id: p.id,
              name: p.title,
              price: p.isOfferActive ? p.offerPrice : p.sellingPrice,
              sellingPrice: p.sellingPrice,
              offerPrice: p.offerPrice,
              category: p.category,
              image: getProductImage(p.files),
              isOfferActive: p.isOfferActive,
              isInCart: p.isInCart,
              cartQuantity: p.cartQuantity,
              isInWishlist: p.isInWishlist,
              averageRating: p.averageRating,
              totalReviews: p.totalReviews,
            }))
          : [];

      setFeatured(mapProducts(featuredRes));
      if (faqsRes?.success) setFaqs(faqsRes.data || []);
      if (topRes?.success) setTopBanners(topRes.data || []);
      if (midRes?.success) setMiddleBanners(midRes.data || []);
      if (botRes?.success) setBottomBanners(botRes.data || []);

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

  /* -------------------- State Updaters -------------------- */
  const updateProductState = (productId: string, updateFn: (p: any) => any) => {
    setFeatured(prev => prev.map(p => p.id === productId ? updateFn(p) : p));
  };

  const handleProductAddedToCart = (productId: string) => {
    updateProductState(productId, (p) => ({ ...p, isInCart: true, cartQuantity: p.cartQuantity + 1 }));
  };

  const handleProductDecreaseFromCart = (productId: string) => {
    updateProductState(productId, (p) => ({ ...p, cartQuantity: p.cartQuantity - 1 }));
  };

  const handleProductDeleteFromCart = (productId: string) => {
    updateProductState(productId, (p) => ({ ...p, isInCart: false, cartQuantity: 0 }));
  };

  const handleProductToggleWishlist = (productId: string) => {
    updateProductState(productId, (p) => ({ ...p, isInWishlist: !p.isInWishlist }));
  };

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
        <div className="pt-6 pb-4 space-y-4">
          {topBanners.map(banner => (
            <StorefrontBanner key={banner.id} banner={banner} />
          ))}
          {topBanners.length === 0 && (
            <div className="rounded-3xl overflow-hidden shadow-sm h-64 bg-[var(--surface-2)] flex items-center justify-center border border-[var(--border)]">
              <span className="text-[var(--foreground-muted)]">No active banners available</span>
            </div>
          )}
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
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <ProductsGrid 
              products={featured}
              handleProductAddedToCart={handleProductAddedToCart}
              handleProductDecreaseFromCart={handleProductDecreaseFromCart}
              handleProductDeleteFromCart={handleProductDeleteFromCart}
              handleProductToggleWishlist={handleProductToggleWishlist}
            />
          )}
        </section>

        {/* Middle Banners */}
        {middleBanners.length > 0 && (
          <section className="py-8 space-y-4 animate-fade-in">
            {middleBanners.map(banner => (
              <StorefrontBanner key={banner.id} banner={banner} />
            ))}
          </section>
        )}

        {/* FAQs Section */}
        <section className="py-16 animate-fade-in mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-[var(--foreground)] tracking-tight">Frequently Asked Questions</h2>
            <p className="text-[var(--foreground-muted)] mt-4 max-w-2xl mx-auto">Have questions? We're here to help.</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.length > 0 ? (
              faqs.map((faq) => (
                <div 
                  key={faq.id} 
                  className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                  >
                    <span className="font-bold text-[var(--foreground)]">{faq.question}</span>
                    <span className={`text-primary transition-transform duration-300 ${openFaq === faq.id ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  <div 
                    className={`px-6 text-[var(--foreground-muted)] transition-all duration-300 overflow-hidden ${
                      openFaq === faq.id ? 'max-h-96 pb-5 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    {faq.answer}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-[var(--foreground-muted)]">No FAQs available right now.</p>
            )}
          </div>
        </section>

        {/* Bottom Banners */}
        {bottomBanners.length > 0 && (
          <section className="py-8 space-y-4 animate-fade-in mb-8">
            {bottomBanners.map(banner => (
              <StorefrontBanner key={banner.id} banner={banner} />
            ))}
          </section>
        )}
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
