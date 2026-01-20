"use client"

import CheckoutForm from '@/components/CheckoutForm'
import { useParams } from 'next/navigation'
import React from 'react'

const CheckoutOrder = () => {
  const params = useParams()
  const orderId = params.id as string
  return (
    <>
      <CheckoutForm orderId={orderId}/>
    </>
  )
}

export default CheckoutOrder