"use client"
import React from 'react'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

const PaymentSuccess = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20 animate-bounce">
        <CheckCircle size={48} />
      </div>
      <h1 className="text-3xl sm:text-4xl font-black mb-4 text-emerald-500 tracking-tight">Payment Successful!</h1>
      <p className="text-[var(--foreground-muted)] max-w-md mx-auto mb-8 font-medium">
        Your payment has been processed successfully. We've received your order and are getting it ready.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        <Link href="/user/orders" className="flex-1 bg-primary text-white font-bold py-3 px-6 rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all text-center">
          View Orders
        </Link>
        <Link href="/user/home" className="flex-1 bg-[var(--surface-2)] text-[var(--foreground)] font-bold py-3 px-6 rounded-xl hover:bg-[var(--surface-3)] transition-all text-center border border-[var(--border)]">
          Go to Home
        </Link>
      </div>
    </div>
  )
}

export default PaymentSuccess