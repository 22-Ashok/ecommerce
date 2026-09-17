import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, ArrowRight, ShoppingBag, AlertCircle, MapPin, X, Plus } from "lucide-react";
import { useCartStore } from "../store/cartStore";
import api from "../services/api";

export default function Cart() {
  const { cart, loading, error, fetchCart, removeFromCart, checkout } = useCartStore();
  const navigate = useNavigate();
  const [paying, setPaying] = useState(false);

  // Address modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [addressError, setAddressError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });

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

  const handleInitialCheckoutClick = async () => {
    setAddressError("");
    try {
      const res = await api.get("/auth/address");
      const list = res.data.addresses || [];
      setAddresses(list);
      if (list.length > 0) {
        setSelectedAddressId(list[0].id);
        setIsAddingNew(false);
      } else {
        setIsAddingNew(true);
      }
      setShowAddressModal(true);
    } catch (err) {
      setAddressError("Failed to fetch addresses. Please try again.");
    }
  };

  const handleSaveNewAddress = async (e) => {
    e.preventDefault();
    setAddressError("");
    try {
      const res = await api.post("/auth/address", { ...formData, isDefault: true });
      const newAddr = res.data.address;
      setAddresses([newAddr, ...addresses]);
      setSelectedAddressId(newAddr.id);
      setIsAddingNew(false);
    } catch (err) {
      setAddressError(err.response?.data?.error || "Failed to save address");
    }
  };

  const executeCheckoutWithAddress = async () => {
    if (!selectedAddressId) {
      setAddressError("Please select or add a shipping address to proceed.");
      return;
    }

    setShowAddressModal(false);

    try {
      setPaying(true);
      const orderId = await checkout();

      let razorpayData = null;
      try {
        const paymentRes = await api.post(`/payments/order/${orderId}/initiate`, {
          addressId: selectedAddressId,
        });
        razorpayData = paymentRes.data;
      } catch (e) {
        console.warn("Could not initiate razorpay payment, proceeding with direct confirmation");
      }

      const res = await loadRazorpayScript();
      if (!res || !razorpayData?.razorpayOrderId) {
        await api.post(`/payments/order/${orderId}/confirm`).catch(() => {});
        navigate(`/checkout/success?orderId=${orderId}`);
        return;
      }

       const options = {
         key: import.meta.env.VITE_RAZORPAY_KEY_ID || razorpayData?.keyId || "rzp_test_mockkey",
        amount: razorpayData.amount,
        currency: razorpayData.currency || "INR",
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

      {(error || addressError) && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <span>{error || addressError}</span>
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
                    Price: {Number(item.price).toFixed(2)} × {item.quantity}
                  </p>
                  <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                    Stock available: {item.available_stock}
                  </span>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <span className="text-xs text-gray-400 block">Subtotal</span>
                    <span className="text-lg font-extrabold text-indigo-600">
                      {Number(item.subtotal).toFixed(2)}
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
                <span>{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600 font-semibold">Free</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-extrabold text-gray-900">
                <span>Total Amount</span>
                <span className="text-indigo-600">{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleInitialCheckoutClick}
              disabled={loading || paying}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 px-4 rounded-xl font-bold shadow-md transition-all disabled:opacity-50"
            >
              <span>{paying ? "Processing..." : "Proceed to Checkout"}</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Shipping Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <MapPin className="h-6 w-6 text-indigo-600" />
                <span>Select Shipping Address</span>
              </h3>
              <button
                onClick={() => setShowAddressModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {addressError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">
                {addressError}
              </div>
            )}

            {!isAddingNew && addresses.length > 0 ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start justify-between ${
                        selectedAddressId === addr.id
                          ? "border-indigo-600 bg-indigo-50/50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="font-bold text-gray-900 text-sm">{addr.full_name}</span>
                        <p className="text-xs text-gray-600">
                          {addr.address_line1}, {addr.city}, {addr.state} - {addr.postal_code}, {addr.country}
                        </p>
                        <p className="text-xs text-gray-500">Phone: {addr.phone_number}</p>
                      </div>
                      {selectedAddressId === addr.id && (
                        <span className="bg-indigo-600 text-white text-xs px-2.5 py-1 rounded-full font-bold">
                          Selected
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setIsAddingNew(true)}
                  className="w-full py-3 border-2 border-dashed border-indigo-200 hover:border-indigo-600 text-indigo-600 rounded-2xl font-semibold text-sm flex items-center justify-center space-x-2 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add New Address</span>
                </button>

                <button
                  onClick={executeCheckoutWithAddress}
                  disabled={paying}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold shadow-md transition-all text-base"
                >
                  {paying ? "Processing Payment..." : "Deliver Here & Pay"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveNewAddress} className="space-y-4">
                <h4 className="font-bold text-gray-800 text-sm">Enter Delivery Address</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Full Name"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="p-3 bg-gray-50 border border-gray-300 rounded-xl text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Phone Number"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="p-3 bg-gray-50 border border-gray-300 rounded-xl text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Address Line 1"
                    required
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    className="sm:col-span-2 p-3 bg-gray-50 border border-gray-300 rounded-xl text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Address Line 2 (Optional)"
                    value={formData.addressLine2}
                    onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                    className="sm:col-span-2 p-3 bg-gray-50 border border-gray-300 rounded-xl text-sm"
                  />
                  <input
                    type="text"
                    placeholder="City"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="p-3 bg-gray-50 border border-gray-300 rounded-xl text-sm"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="p-3 bg-gray-50 border border-gray-300 rounded-xl text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Postal Code"
                    required
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="p-3 bg-gray-50 border border-gray-300 rounded-xl text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Country"
                    required
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="p-3 bg-gray-50 border border-gray-300 rounded-xl text-sm"
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsAddingNew(false)}
                      className="w-1/3 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold text-sm"
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold shadow-md text-sm"
                  >
                    Save & Deliver Here
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
