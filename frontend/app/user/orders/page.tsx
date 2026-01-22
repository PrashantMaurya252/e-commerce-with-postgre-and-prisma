'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { getAllOrders } from '@/utils/api'

type Order = any

const statusColor = (status: string) => {
  switch (status) {
    case 'PAID':
      return 'bg-green-100 text-green-700'
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-700'
    case 'CANCELLED':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAllOrders = async () => {
      try {
        const res = await getAllOrders()
        setOrders(res.data)
      } catch (error) {
        console.error('fetch all orders', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAllOrders()
  }, [])

  if (loading) {
    return <div className="p-6 text-center">Loading orders...</div>
  }

  if (!orders.length) {
    return <div className="p-6 text-center">No orders found</div>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-6">My Orders</h1>

      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border rounded-xl p-4 md:p-6 shadow-sm bg-white"
          >
            {/* Order Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500">
                  Order ID: <span className="font-medium">{order.id.slice(0, 8)}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Placed on:{' '}
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 text-xs rounded-full font-medium ${statusColor(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>

                {order.payment && (
                  <span className="text-xs text-green-700 font-medium">
                    Payment: {order.payment.status}
                  </span>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="mt-4 space-y-4">
              {order.items.map((item: any) => {
                const product = item.product
                const image =
                  product?.files?.[0]?.url || '/placeholder.png'

                return (
                  <div
                    key={item.id}
                    className="flex gap-4 items-start border-t pt-4"
                  >
                    {/* Product Image */}
                    <div className="relative w-20 h-20 shrink-0">
                      <Image
                        src={image}
                        alt={product.title}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <p className="font-medium">{product.title}</p>
                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity}
                      </p>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-semibold">
                          ₹{product.isOfferActive
                            ? product.offerPrice
                            : product.price}
                        </span>

                        {product.isOfferActive && (
                          <span className="line-through text-sm text-gray-400">
                            ₹{product.price}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Order Summary */}
            <div className="border-t mt-4 pt-4 flex flex-col sm:flex-row sm:justify-between gap-2">
              <div className="text-sm text-gray-600">
                Subtotal: ₹{order.subTotal}
                {order.discountAmount > 0 && (
                  <>
                    <br />
                    Discount: -₹{order.discountAmount}
                  </>
                )}
              </div>

              <div className="text-lg font-semibold">
                Total: ₹{order.total}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Orders
