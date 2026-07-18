"use client";

import React, { useEffect, useState } from "react";
import { getPublicBannersAPI } from "@/utils/api";
import StorefrontBanner from "@/components/home/StorefrontBanner";
import { X } from "lucide-react";

export default function ProductPopupBanner() {
  const [banners, setBanners] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    // Only show once per session to avoid annoying the user
    const hasSeenPopup = sessionStorage.getItem("hasSeenProductPopup");
    if (hasSeenPopup) return;

    const fetchPopups = async () => {
      // First try PRODUCT specific banners, otherwise APP_POPUP global banners
      const productBanners = await getPublicBannersAPI("PRODUCT", 5);
      let validBanners = productBanners?.data || [];
      
      if (validBanners.length === 0) {
        const appBanners = await getPublicBannersAPI("APP_POPUP", 5);
        validBanners = appBanners?.data || [];
      }

      if (validBanners.length > 0) {
        setBanners(validBanners);
        setIsOpen(true);
        sessionStorage.setItem("hasSeenProductPopup", "true");
      }
    };

    fetchPopups();
  }, []);

  if (!isOpen || banners.length === 0) return null;

  const activeBanner = banners[currentBannerIndex];

  const handleNext = () => {
    if (currentBannerIndex < banners.length - 1) {
      setCurrentBannerIndex(prev => prev + 1);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[var(--card)] rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scale-in">
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-colors"
        >
          <X size={20} />
        </button>

        <StorefrontBanner banner={activeBanner} />

        {/* If there are multiple banners, show a "Next" button, otherwise just close/continue */}
        <div className="p-4 bg-[var(--surface-2)] border-t border-[var(--border)] flex justify-between items-center">
          <div className="flex gap-2">
            {banners.map((_, i) => (
              <div 
                key={i} 
                className={`h-2 rounded-full transition-all ${i === currentBannerIndex ? 'w-6 bg-emerald-500' : 'w-2 bg-[var(--border)]'}`} 
              />
            ))}
          </div>
          <button 
            onClick={handleNext}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
          >
            {currentBannerIndex < banners.length - 1 ? "Next Offer" : "Continue Shopping"}
          </button>
        </div>
      </div>
    </div>
  );
}
