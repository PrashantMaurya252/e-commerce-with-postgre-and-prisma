"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { checkout, getAddressesAPI, addAddressAPI } from "@/utils/api";
import { useGetCartItemsQuery } from "@/redux/services/cartApi";

export default function CheckoutSelectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const couponCode = searchParams.get("coupon") || "";

  const { data: cartData, isLoading: cartLoading } = useGetCartItemsQuery();
  const cartTotalAmount = cartData?.data?.total || 0;
  
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD"); // 'COD' | 'ONLINE'
  
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingAddresses, setFetchingAddresses] = useState(true);

  // Form state for new address
  const [formData, setFormData] = useState({
    line1: "",
    line2: "",
    landmark: "",
    phoneNumber1: "",
    phoneNumber2: "",
    pincode: "",
    city: "",
    isDefault: false
  });

  const fetchAddresses = async () => {
    setFetchingAddresses(true);
    const res = await getAddressesAPI();
    if (res.success) {
      setAddresses(res.data);
      if (res.data.length > 0) {
        setSelectedAddressId(res.data[0].id);
      } else {
        setShowAddAddress(true);
      }
    }
    setFetchingAddresses(false);
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await addAddressAPI(formData);
    if (res.success) {
      toast.success("Address added successfully");
      setShowAddAddress(false);
      await fetchAddresses();
      setSelectedAddressId(res.data.id);
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error("Please select an address");
      return;
    }
    setLoading(true);
    const res = await checkout({ couponCode, addressId: selectedAddressId, paymentMethod });
    if (res.success) {
      toast.success("Order Placed Successfully!");
      if (paymentMethod === "ONLINE") {
        router.push(`/user/cart/checkout/${res.data.orderId}`);
      } else {
        router.push(`/user/orders`);
      }
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  if (cartLoading || fetchingAddresses) {
    return <div className="p-10 text-center">Loading checkout...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      <h1 className="text-3xl font-black mb-8 text-gradient">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          
          {/* Address Section */}
          <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Delivery Address</h2>
              {!showAddAddress && (
                <button onClick={() => setShowAddAddress(true)} className="text-primary font-medium text-sm hover:underline">
                  + Add New
                </button>
              )}
            </div>

            {showAddAddress ? (
              <form onSubmit={handleAddAddress} className="space-y-3">
                <input required placeholder="Flat, House no., Building" className="w-full p-2 border rounded-lg bg-[var(--surface-2)] outline-none focus:border-primary" value={formData.line1} onChange={e => setFormData({...formData, line1: e.target.value})} />
                <input placeholder="Area, Street, Sector (Optional)" className="w-full p-2 border rounded-lg bg-[var(--surface-2)] outline-none focus:border-primary" value={formData.line2} onChange={e => setFormData({...formData, line2: e.target.value})} />
                <input placeholder="Landmark (Optional)" className="w-full p-2 border rounded-lg bg-[var(--surface-2)] outline-none focus:border-primary" value={formData.landmark} onChange={e => setFormData({...formData, landmark: e.target.value})} />
                <div className="flex gap-2">
                  <input required placeholder="City" className="w-full p-2 border rounded-lg bg-[var(--surface-2)] outline-none focus:border-primary" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                  <input required placeholder="Pincode" className="w-full p-2 border rounded-lg bg-[var(--surface-2)] outline-none focus:border-primary" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} />
                </div>
                <div className="flex gap-2">
                  <input required placeholder="Phone Number" className="w-full p-2 border rounded-lg bg-[var(--surface-2)] outline-none focus:border-primary" value={formData.phoneNumber1} onChange={e => setFormData({...formData, phoneNumber1: e.target.value})} />
                  <input placeholder="Alt Phone (Optional)" className="w-full p-2 border rounded-lg bg-[var(--surface-2)] outline-none focus:border-primary" value={formData.phoneNumber2} onChange={e => setFormData({...formData, phoneNumber2: e.target.value})} />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowAddAddress(false)} className="w-full p-2 bg-gray-500/20 text-gray-500 rounded-lg hover:bg-gray-500/30">Cancel</button>
                  <button type="submit" disabled={loading} className="w-full p-2 bg-primary text-white rounded-lg hover:brightness-110">Save Address</button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                {addresses.length === 0 ? (
                  <p className="text-gray-500 text-sm">No saved addresses. Please add one.</p>
                ) : (
                  addresses.map(addr => (
                    <label key={addr.id} className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-primary bg-primary/10 shadow-sm' : 'border-[var(--border)] hover:border-primary/50'}`}>
                      <input type="radio" name="address" checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} className="mt-1" />
                      <div>
                        <p className="font-medium text-sm">{addr.line1}</p>
                        <p className="text-sm text-[var(--foreground-muted)]">{addr.city}, {addr.pincode}</p>
                        <p className="text-sm font-medium mt-1">Phone: {addr.phoneNumber1}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Payment Method Section */}
          <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)]">
            <h2 className="text-xl font-bold mb-4">Payment Method</h2>
            <div className="space-y-3">
              <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-primary bg-primary/10 shadow-sm' : 'border-[var(--border)] hover:border-primary/50'}`}>
                <input type="radio" name="payment" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} />
                <span className="font-medium">Cash on Delivery (COD)</span>
              </label>
              <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'ONLINE' ? 'border-primary bg-primary/10 shadow-sm' : 'border-[var(--border)] hover:border-primary/50'}`}>
                <input type="radio" name="payment" checked={paymentMethod === 'ONLINE'} onChange={() => setPaymentMethod('ONLINE')} />
                <span className="font-medium">Pay Online (Card, UPI, Wallet)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column (Summary & Action) */}
        <div className="space-y-6">
          <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)]">
            <h2 className="text-xl font-bold mb-4">Finalizing Order</h2>
            <div className="space-y-2 text-sm text-[var(--foreground-muted)]">
              <p>Total items amount: <span className="float-right font-bold text-[var(--foreground)]">₹{cartTotalAmount}</span></p>
              {couponCode && <p className="text-emerald-500">Coupon applied: <span className="float-right font-bold">{couponCode}</span></p>}
            </div>
            
            <button
              onClick={handlePlaceOrder}
              disabled={loading || addresses.length === 0}
              className="w-full mt-6 bg-primary text-white font-bold py-3 px-4 rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50"
            >
              {loading ? "Processing..." : paymentMethod === "ONLINE" ? "Proceed to Payment" : "Place Order (COD)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
