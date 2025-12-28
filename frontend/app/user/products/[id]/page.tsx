"use client"

import { useEffect, useState } from "react"
import ProductImageGallery from "@/components/products/ProductImageGallery"
import ProductImageGallerySkeleton from "@/components/products/ProductImageGallerySkeleton"
import ProductDetailsSkeleton from "@/components/products/ProductsDetailsSkeleton"
import { productDetails } from "@/utils/api"
import { useParams } from "next/navigation"

interface Product {
  title: string
  description: string
  price: number
  offerPrice: number
  isOfferActive: boolean
  itemLeft: number
  files: any[]
}

export default function ProductDetailsPage() {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

const { id } = useParams<{ id: string }>()
  console.log(id)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await productDetails(id)
        if (res.success && res.data) {
          setProduct(res.data)
        }
      } finally {
        setLoading(false)
      }
    }

    if(id){
       fetchProduct()
    }

    
  }, [id])

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Image Section */}
        {loading ? (
          <ProductImageGallerySkeleton />
        ) : product ? (
          <ProductImageGallery images={product.files} />
        ) : null}

        {/* Details Section */}
        {loading ? (
          <ProductDetailsSkeleton />
        ) : product ? (
          <div>
            <h1 className="text-xl md:text-2xl font-semibold">
              {product.title}
            </h1>

            <p className="text-gray-600 mt-3 text-sm md:text-base">
              {product.description}
            </p>

            <div className="mt-4 flex items-center gap-4">
              <span className="text-2xl font-bold">
                ₹{product.isOfferActive ? product.offerPrice : product.price}
              </span>

              {product.isOfferActive && (
                <span className="line-through text-gray-500">
                  ₹{product.price}
                </span>
              )}
            </div>

            <p className="mt-2 text-sm text-gray-500">
              {product.itemLeft} items left
            </p>

            <button className="mt-6 w-full md:w-auto bg-black text-white px-6 py-3 rounded-md">
              Add to Cart
            </button>
          </div>
        ) : (
          <p>Product not found</p>
        )}
      </div>
    </div>
  )
}
