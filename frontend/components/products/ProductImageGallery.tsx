"use client"

import Image from "next/image"
import { useState } from "react"
import { ProductFile } from "@/types/product"

interface Props {
  images: ProductFile[]
}

export default function ProductImageGallery({ images }: Props) {
  const [activeImage, setActiveImage] = useState(images[0])

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-4">
      
      {/* Thumbnails */}
      <div
        className="
          flex gap-3
          lg:flex-col
          overflow-x-auto lg:overflow-visible
          scrollbar-hide
        "
      >
        {images.map((img) => (
          <button
            key={img.id}
            onClick={() => setActiveImage(img)}
            className={`
              flex-shrink-0
              border rounded-md p-1 transition
              ${
                activeImage.id === img.id
                  ? "border-black"
                  : "border-gray-300 hover:border-gray-500"
              }
            `}
          >
            <Image
              src={img.url}
              alt="Product thumbnail"
              width={70}
              height={70}
              className="object-cover rounded"
            />
          </button>
        ))}
      </div>

      {/* Main Image */}
      <div className="relative w-full lg:w-[420px] aspect-square border rounded-lg overflow-hidden">
        <Image
          src={activeImage.url}
          alt="Product image"
          fill
          priority
          className="object-cover"
        />
      </div>
    </div>
  )
}
