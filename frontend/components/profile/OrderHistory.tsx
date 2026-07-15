import React, { useState } from 'react'
import Image from 'next/image'
import { Package, Star } from 'lucide-react'
import ReviewModal from './ReviewModal'

const statusColor = (status: string) => {
  switch (status) {
    case 'PAID':
      return 'bg-green-100 text-green-700'
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-700'
    case 'CANCELLED':
      return 'bg-red-100 text-red-700'
    case 'DELIVERED':
      return 'bg-blue-100 text-blue-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export default function OrderHistory({ orders, userReviews }: { orders: any[], userReviews: any[] }) {
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedProductForReview, setSelectedProductForReview] = useState<string | null>(null)
  
  if (!orders || orders.length === 0) {
    return (
      <div className="py-12 text-center bg-[var(--surface-2)] rounded-2xl border border-dashed border-[var(--border)]">
        <Package size={48} className="mx-auto mb-3 text-[var(--foreground-muted)] opacity-50" />
        <h3 className="text-lg font-semibold text-[var(--foreground)]">No Orders Yet</h3>
        <p className="text-[var(--foreground-muted)] max-w-sm mx-auto mt-2">Looks like you haven't placed any orders. Discover amazing products and place your first order!</p>
      </div>
    )
  }

  const handleOpenReview = (productId: string) => {
    setSelectedProductForReview(productId)
    setReviewModalOpen(true)
  }

  const getExistingReview = (productId: string) => {
    return userReviews?.find(r => r.productId === productId)
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <div key={order.id} className="border border-[var(--border)] rounded-2xl p-4 md:p-6 shadow-sm bg-[var(--card)] hover:shadow-md transition-shadow">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
            <div>
              <p className="text-sm text-[var(--foreground-muted)]">
                Order ID: <span className="font-semibold text-[var(--foreground)]">#{order.id.slice(0, 8)}</span>
              </p>
              <p className="text-sm text-[var(--foreground-muted)]">
                Placed on: {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-xs rounded-full font-bold ${statusColor(order.status)}`}>
                {order.status}
              </span>
              {order.payment && (
                <span className={`px-3 py-1 text-xs rounded-full font-bold ${statusColor(order.payment.status)}`}>
                  Payment: {order.payment.status}
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {order.items.map((item: any) => {
              const product = item.product
              const image = product?.files?.[0]?.url || '/placeholder.png'
              const canReview = order.status === 'DELIVERED'
              const existingReview = getExistingReview(product.id)

              return (
                <div key={item.id} className="flex gap-4 items-start">
                  <div className="relative w-20 h-20 shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-[var(--border)]">
                    <Image src={image} alt={product.title} fill className="object-cover" />
                  </div>

                  <div className="flex-1">
                    <h4 className="font-semibold text-[var(--foreground)]">{product.title}</h4>
                    <p className="text-sm text-[var(--foreground-muted)] mt-0.5">Qty: {item.quantity}</p>

                    <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">₹{product.isOfferActive ? product.offerPrice : product.sellingPrice}</span>
                        {product.isOfferActive && (
                          <span className="line-through text-xs text-[var(--foreground-muted)]">₹{product.sellingPrice}</span>
                        )}
                      </div>

                      {canReview && (
                        <button
                          onClick={() => handleOpenReview(product.id)}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-400 text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors"
                        >
                          <Star size={14} className={existingReview ? "fill-amber-500" : ""} />
                          {existingReview ? 'Update Review' : 'Write Review'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="border-t border-[var(--border)] mt-5 pt-4 flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="text-sm text-[var(--foreground-muted)] w-full sm:w-auto text-left">
              Subtotal: ₹{order.subTotal}
              {order.discountAmount > 0 && <span className="ml-2 text-green-600">Discount: -₹{order.discountAmount}</span>}
            </div>
            <div className="text-lg font-black text-[var(--foreground)] w-full sm:w-auto text-right">
              Total: ₹{order.total}
            </div>
          </div>
        </div>
      ))}

      {reviewModalOpen && selectedProductForReview && (
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          productId={selectedProductForReview}
          existingReview={getExistingReview(selectedProductForReview)}
        />
      )}
    </div>
  )
}
