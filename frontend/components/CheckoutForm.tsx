"use client"

import { useEffect, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import { createPaymentIntent } from "@/utils/api"

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
      alert(error.message)
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button disabled={loading} className="mt-4">
        {loading ? "Processing..." : "Pay Now"}
      </button>
    </form>
  )
}

const CheckoutForm = ({ orderId }: { orderId: string }) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  useEffect(() => {
    const fetchClientSecret = async () => {
      const res = await createPaymentIntent({ orderId })
      if (res.success) {
        setClientSecret(res.data.clientSecret)
      }
    }
    fetchClientSecret()
  }, [orderId])

  if (!clientSecret) return <div>Loading payment...</div>

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: { theme: "stripe" },
      }}
    >
      <PaymentForm />
    </Elements>
  )
}

export default CheckoutForm
