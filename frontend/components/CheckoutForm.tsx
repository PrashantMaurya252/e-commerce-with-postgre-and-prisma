"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { loadStripe } from "@stripe/stripe-js"
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import { createPaymentIntent } from "@/utils/api"
import { Lock, ShieldCheck } from "lucide-react"
import { useTheme } from "next-themes"

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

const PaymentForm = () => {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/user/payment/success`,
      },
    })

    if (error) {
      toast.error(error.message)
    }

    setLoading(false)
  }

  return (
    <div className="w-full max-w-md mx-auto bg-[var(--card)] p-8 rounded-3xl border border-[var(--border)] shadow-2xl relative overflow-hidden animate-fade-in mt-12 mb-12">
      {/* Decorative gradient */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col items-center mb-8 relative z-10">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 shadow-inner shadow-primary/20">
          <ShieldCheck size={32} className="text-primary" />
        </div>
        <h2 className="text-2xl font-black text-[var(--foreground)] tracking-tight">Secure Checkout</h2>
        <p className="text-sm text-[var(--foreground-muted)] text-center mt-2 font-medium">
          Pay easily via Cards or Wallets
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
        <div className="p-[2px] rounded-xl bg-gradient-to-b from-[var(--border)] to-transparent">
          <div className="bg-[var(--surface-2)] p-4 rounded-lg shadow-inner">
            <PaymentElement 
              options={{ 
                layout: "accordion"
              }} 
            />
          </div>
        </div>
        
        <button 
          disabled={loading || !stripe || !elements} 
          className="w-full group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-xl bg-primary px-8 font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50 disabled:hover:scale-100"
        >
          <span className="absolute inset-0 bg-white/20 translate-y-full transition-transform group-hover:translate-y-0"></span>
          <span className="relative flex items-center gap-2">
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </span>
            ) : (
              <>
                <Lock size={18} />
                Pay Now
              </>
            )}
          </span>
        </button>

        <p className="text-xs text-center text-[var(--foreground-muted)] flex items-center justify-center gap-1 font-medium">
          <Lock size={12} /> Payments are 100% encrypted & secure
        </p>
      </form>
    </div>
  )
}

const DummyCredentialsModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--card)] p-6 rounded-2xl max-w-sm w-full border border-[var(--border)] shadow-2xl relative">
        <h3 className="text-xl font-bold mb-2">Test Credentials</h3>
        <p className="text-sm text-[var(--foreground-muted)] mb-4">Use these details to simulate a successful payment in test mode:</p>
        
        <div className="space-y-4 mb-6 bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border)]">
          <div>
            <span className="text-xs text-[var(--foreground-muted)] block mb-1">Card Number</span>
            <code className="font-mono font-bold text-primary tracking-wider text-sm bg-[var(--card)] px-2 py-1 rounded">4242 4242 4242 4242</code>
          </div>
          <div className="flex gap-4">
            <div>
              <span className="text-xs text-[var(--foreground-muted)] block mb-1">Expiry Date</span>
              <code className="font-mono font-bold text-primary bg-[var(--card)] px-2 py-1 rounded">09/32</code>
            </div>
            <div>
              <span className="text-xs text-[var(--foreground-muted)] block mb-1">CVV</span>
              <code className="font-mono font-bold text-primary bg-[var(--card)] px-2 py-1 rounded">400</code>
            </div>
          </div>
        </div>

        <button onClick={onClose} className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all">
          Got it
        </button>
      </div>
    </div>
  )
}

const CheckoutForm = ({ orderId }: { orderId: string }) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    const fetchClientSecret = async () => {
      const res = await createPaymentIntent({ orderId })
      if (res.success) {
        setClientSecret(res.data.clientSecret)
        setShowModal(true)
      }
    }
    fetchClientSecret()
  }, [orderId])

  if (!clientSecret) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[var(--foreground-muted)] font-medium">Initializing secure gateway...</p>
      </div>
    )
  }

  return (
    <>
      {showModal && <DummyCredentialsModal onClose={() => setShowModal(false)} />}
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: { 
            theme: theme === "dark" ? "night" : "stripe",
            variables: {
              colorPrimary: '#3b82f6',
              fontFamily: 'inherit',
              borderRadius: '12px',
            }
          },
        }}
      >
        <PaymentForm />
      </Elements>
    </>
  )
}

export default CheckoutForm
