"use client";

import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import ProductCarouselSkeleton from "@/components/skeletons/ProductCarouselSkeleton";

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
}

interface Props {
  title: string;
  products?: Product[];
  isLoading?: boolean;
}

export default function ProductCarousel({
  title,
  products = [],
  isLoading = false,
}: Props) {
  if (isLoading) {
    return <ProductCarouselSkeleton />;
  }

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>

      <Carousel>
        <CarouselContent>
          {products.map((product) => (
            <CarouselItem
              key={product.id}
              className="basis-1/2 md:basis-1/4 lg:basis-1/5"
            >
              <div className="border rounded-xl p-4 hover:shadow-lg transition">
                <div className="relative h-40 mb-3">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
                <h3 className="text-sm font-medium">{product.name}</h3>
                <p className="text-orange-600 font-semibold">
                  ₹{product.price}
                </p>
                <button className="mt-2 w-full bg-orange-600 text-white py-2 rounded-md text-sm">
                  Add to Cart
                </button>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </section>
  );
}
