"use client";

import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const banners = [
  {
    title: "Welcome to Desi Market",
    subtitle: "Authentic Indian Products at Best Prices",
    image: "/banner/banner1.png",
  },
  {
    title: "Big Savings on Electronics",
    subtitle: "Latest gadgets & great deals",
    image: "/banner/banner2.png",
  },
  {
    title: "Daily Essentials Delivered",
    subtitle: "Everything you need, every day",
    image: "/banner/banner3.png",
  },
];

export default function BannerCarousel() {
  const autoplay = useRef(
    Autoplay({ delay: 3500, stopOnInteraction: true })
  );

  return (
    <Carousel
      plugins={[autoplay.current]}
      className="w-full"
      onMouseEnter={autoplay.current.stop}
      onMouseLeave={autoplay.current.reset}
    >
      <CarouselContent>
        {banners.map((banner, index) => (
          <CarouselItem key={index}>
            <div className="relative h-[220px] md:h-[420px] rounded-xl overflow-hidden">
              <Image
                src={banner.image}
                alt={banner.title}
                fill
                priority={index === 0}
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex flex-col justify-center px-6 md:px-16">
                <h2 className="text-white text-2xl md:text-4xl font-bold">
                  {banner.title}
                </h2>
                <p className="text-white mt-2 md:text-lg">
                  {banner.subtitle}
                </p>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
