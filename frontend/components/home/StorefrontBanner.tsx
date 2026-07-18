import React from "react";
import { useRouter } from "next/navigation";

export default function StorefrontBanner({ banner, className = "" }: { banner: any, className?: string }) {
  const router = useRouter();

  if (!banner) return null;

  const handleClick = () => {
    switch (banner.actionType) {
      case "PRODUCT":
        if (banner.productId) router.push(`/user/products/${banner.productId}`);
        break;
      case "CATEGORY":
        if (banner.categoryId) router.push(`/user/products?category=${banner.categoryId}`);
        break;
      case "URL":
        if (banner.actionUrl) {
          if (banner.actionUrl.startsWith("http")) {
            window.open(banner.actionUrl, "_blank");
          } else {
            router.push(banner.actionUrl);
          }
        }
        break;
      default:
        break;
    }
  };

  const hasAction = ["PRODUCT", "CATEGORY", "URL"].includes(banner.actionType);

  return (
    <div 
      className={`relative w-full overflow-hidden rounded-2xl group ${hasAction ? "cursor-pointer" : ""} ${className}`}
      onClick={handleClick}
    >
      <picture>
        {banner.mobileImage?.url && (
          <source media="(max-width: 768px)" srcSet={banner.mobileImage.url} />
        )}
        <img 
          src={banner.image?.url} 
          alt={banner.title || "Banner"} 
          className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" 
        />
      </picture>
      
      {/* Optional Gradient Overlay if we want to show text on top, but usually banners have baked-in text */}
    </div>
  );
}
