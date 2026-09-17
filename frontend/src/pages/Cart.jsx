import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, ArrowRight, ShoppingBag, AlertCircle } from "lucide-react";
import { useCartStore } from "../store/cartStore";
import api from "../services/api";

export default function Cart() {
  const { cart, loading, error, fetchCart, removeFromCart, checkout } = useCartStore();
  const navigate = useNavigate();
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const totalAmount = cart.reduce((acc, item) => acc + Number(item.subtotal), 0);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    try {
      setPaying(true);
      // 1. Create order in backend
      const orderId = await checkout();

      // 2. Initiate payment and get Razorpay order ID
      let razorpayData = null;
      try {
        const paymentRes = await api.post(`/payments/order/${orderId}/initiate`);
        razorpayData = paymentRes.data;
      } catch (e) {
        console.warn("Could not initiate razorpay payment, proceeding with direct confirmation");
      }

      // 3. Load Razorpay SDK
      const res = await loadRazorpayScript();
      if (!res || !razorpayData?.razorpayOrderId) {
        // Fallback if razorpay script or order id is not available
        await api.post(`/payments/order/${orderId}/confirm`).catch(() => {});
        navigate(`/checkout/success?orderId=${orderId}`);
        return;
      }

      // 4. Open Razorpay Checkout modal
      const options = {
        key: razorpayData.keyId || "rzp_test_mockkey",
        amount: razorpayData.amount,
        currency: razorpayData.currency || "USD",
        name: "NexusShop",
        description: `Order #${orderId}`,
        order_id: razorpayData.razorpayOrderId,
        handler: async function (response) {
          try {
            await api.post(`/payments/order/${orderId}/confirm`, {
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
          } catch (err) {
            console.error("Payment confirmation failed", err);
          }
          navigate(`/checkout/success?orderId=${orderId}`);
        },
        theme: {
          color: "#4f46e5",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      alert(err.response?.data?.error || "Checkout failed");
    } finally {
      setPaying(false);
    }
  };

  if (loading && cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 animate-pulse text-lg">Loading your cart...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8 flex items-center space-x-3">
        <ShoppingCart className="h-8 w-8 text-indigo-600" />
        <span>Shopping Cart</span>
      </h1>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {cart.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 shadow-sm">
          <ShoppingBag className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-800">Your cart is empty</h3>
          <p className="text-gray-500 text-sm mt-1 mb-6">Explore products and add them to your cart.</p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md transition-all"
          >
            <span>Start Shopping</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div
                key={item.cart_item_id}
                className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between"
              >
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500">
                    Price: ${Number(item.price).toFixed(2)} × {item.quantity}
                  </p>
                  <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                    Stock available: {item.available_stock}
                  </span>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <span className="text-xs text-gray-400 block">Subtotal</span>
                    <span className="text-lg font-extrabold text-indigo-600">
                      ${Number(item.subtotal).toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product_id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-fit space-y-6">
            <h3 className="text-xl font-bold text-gray-900 border-b pb-4">Order Summary</h3>

            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Items ({cart.reduce((a, c) => a + c.quantity, 0)})</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600 font-semibold">Free</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-extrabold text-gray-900">
                <span>Total Amount</span>
                <span className="text-indigo-600">${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading || paying}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 px-4 rounded-xl font-bold shadow-md transition-all disabled:opacity-50"
            >
              <span>{paying ? "Opening Payment..." : "Proceed to Checkout"}</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
