import BannerCarousel from "@/components/home/BannerCarousel";
import ProductCarousel from "@/components/home/ProductCarousel";

export default function Home() {
  const isLoading = false; // replace with API state

  return (
    <main className="max-w-7xl mx-auto px-4">
      <BannerCarousel />

      {/* <ProductCarousel
        title="Electronics"
        isLoading={isLoading}
        products={electronics}
      />

      <ProductCarousel
        title="Clothes"
        isLoading={isLoading}
        products={clothes}
      />

      <ProductCarousel
        title="Daily Usage"
        isLoading={isLoading}
        products={dailyUsage}
      /> */}
    </main>
  );
}
