import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, Package, ArrowRight, ShieldCheck } from "lucide-react";
import api from "../services/api";

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [orderDetails, setOrderDetails] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const res = await api.get(`/catalog/orders/${orderId}`);
      setOrderDetails(res.data.order);
      setOrderItems(res.data.items || []);
    } catch (err) {
      console.error("Failed to fetch order details", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-gray-200 shadow-xl space-y-6">
        <div className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-2">
          <CheckCircle2 className="h-12 w-12" />
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900">Order Placed Successfully!</h1>
        <p className="text-gray-600 max-w-md mx-auto">
          Thank you for your purchase. Your order has been securely recorded and dispatched to the event streaming pipeline.
        </p>

        {orderId && (
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl inline-block">
            <span className="text-sm text-indigo-700 font-semibold block">Order ID</span>
            <span className="text-2xl font-mono font-bold text-indigo-900">#{orderId}</span>
          </div>
        )}

        {orderDetails && (
          <div className="text-left bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-3">
            <h3 className="font-bold text-gray-800 border-b pb-2">Order Summary</h3>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Status:</span>
              <span className="font-semibold text-indigo-600 uppercase">{orderDetails.status}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Total Amount:</span>
              <span className="font-bold text-gray-900">${Number(orderDetails.total_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Date:</span>
              <span>{new Date(orderDetails.created_at).toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="pt-4 flex justify-center space-x-4">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md transition-all"
          >
            <Package className="h-5 w-5" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
