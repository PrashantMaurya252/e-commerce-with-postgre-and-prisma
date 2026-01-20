"use client"

import React, { useEffect } from 'react'
import {useState} from 'react'
import {EmbeddedCheckoutProvider,EmbeddedCheckout} from '@stripe/react-stripe-js'
import {loadStripe} from '@stripe/stripe-js'
import { createPaymentIntent } from '@/utils/api'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const CheckoutForm = ({orderId}:{orderId:string}) => {
    const [clientSecret,setClientSecret] = useState<string | null>(null)
    const [loading,setLoading] = useState(true)

    const fetchClientSecret = async()=>{
        try {
            const payload={orderId}
        const response = await createPaymentIntent(payload)
        if(response.success){
            setClientSecret(response.data.clientSecret)
        }
        } catch (error) {
            console.error("Fetch Client Secret",error)
        }finally{
            setLoading(false)
        }
        
    }

    useEffect(()=>{
     fetchClientSecret()
    },[])

    if(loading){
        return (
            <div>Loading Payment Form .....</div>
        )
    }

  return (
    <EmbeddedCheckoutProvider stripe={stripePromise} options={{clientSecret:clientSecret!}}>
       <EmbeddedCheckout/>
    </EmbeddedCheckoutProvider>
  )
}

export default CheckoutForm