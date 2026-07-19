"use client"
import React from 'react'
import { XCircle } from 'lucide-react'
import Link from 'next/link'

const PaymentFailed = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="w-24 h-24 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-rose-500/20">
        <XCircle size={48} />
      </div>
      <h1 className="text-3xl sm:text-4xl font-black mb-4 text-rose-500 tracking-tight">Payment Failed</h1>
      <p className="text-[var(--foreground-muted)] max-w-md mx-auto mb-8 font-medium">
        We couldn't process your payment. Your card was not charged. Please try again or use a different payment method.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        <Link href="/user/cart" className="flex-1 bg-rose-500 text-white font-bold py-3 px-6 rounded-xl hover:shadow-lg hover:shadow-rose-500/20 transition-all text-center hover:bg-rose-600">
          Try Again
        </Link>
        <Link href="/user/home" className="flex-1 bg-[var(--surface-2)] text-[var(--foreground)] font-bold py-3 px-6 rounded-xl hover:bg-[var(--surface-3)] transition-all text-center border border-[var(--border)]">
          Go to Home
        </Link>
      </div>
    </div>
  )
}

export default PaymentFailed
