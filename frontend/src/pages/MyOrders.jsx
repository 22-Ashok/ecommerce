import React, { useEffect, useState } from "react";
import { Package, Truck, CheckCircle2, Clock, ShieldCheck, AlertCircle, ShoppingBag, FileText, X } from "lucide-react";
import api from "../services/api";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invoiceData, setInvoiceData] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/catalog/orders/track");
      setOrders(res.data.orders || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoice = async (orderId) => {
    try {
      const res = await api.get(`/catalog/orders/${orderId}/invoice`);
      setInvoiceData(res.data);
    } catch (err) {
      alert("Failed to load invoice");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "shipped":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "delivered":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8 flex items-center space-x-3">
        <Package className="h-8 w-8 text-indigo-600" />
        <span>My Orders & Tracking</span>
      </h1>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          {[1, 2].map((n) => (
            <div key={n} className="bg-white p-6 rounded-2xl border border-gray-200 animate-pulse h-48"></div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 shadow-sm">
          <ShoppingBag className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-800">No orders placed yet</h3>
          <p className="text-gray-500 text-sm mt-1">Once you make a purchase, you can track its delivery status here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(({ order, items, timeline }) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4">
                <div>
                  <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider block">
                    Order ID #{order.id}
                  </span>
                  <span className="text-xs text-gray-500">
                    Placed on {new Date(order.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className="text-xs text-gray-400 block">Total Amount</span>
                    <span className="text-lg font-extrabold text-gray-900">
                      ${Number(order.total_amount).toFixed(2)}
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                  <button
                    onClick={() => fetchInvoice(order.id)}
                    className="flex items-center space-x-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Invoice</span>
                  </button>
                </div>
              </div>

              {/* Ordered Items */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-800">Ordered Products</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex items-center justify-between text-sm"
                    >
                      <span className="font-semibold text-gray-800">{item.name}</span>
                      <span className="text-gray-600">
                        Qty: {item.quantity} × ${Number(item.price).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual History Timeline */}
              <div className="pt-4 border-t">
                <h4 className="text-sm font-bold text-gray-800 mb-4">Delivery Timeline</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {timeline.map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center text-center space-y-2">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                          step.completed
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                            : "bg-gray-100 text-gray-400 border border-gray-200"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${
                          step.completed ? "text-indigo-900" : "text-gray-400"
                        }`}
                      >
                        {step.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice Modal */}
      {invoiceData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-gray-100 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-2xl font-extrabold text-gray-900">Tax Invoice</h3>
                <span className="text-xs text-indigo-600 font-semibold">{invoiceData.invoiceNumber}</span>
              </div>
              <button
                onClick={() => setInvoiceData(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex justify-between text-sm text-gray-600">
              <div>
                <p className="font-semibold text-gray-800">Billed To:</p>
                <p>{invoiceData.customerEmail}</p>
                {invoiceData.shippingAddress && (
                  <p className="mt-1">
                    {invoiceData.shippingAddress.full_name} ({invoiceData.shippingAddress.phone_number})<br />
                    {invoiceData.shippingAddress.address_line1}, {invoiceData.shippingAddress.city}, {invoiceData.shippingAddress.state} - {invoiceData.shippingAddress.postal_code}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-800">Invoice Date:</p>
                <p>{new Date(invoiceData.date).toLocaleString()}</p>
                <p className="font-semibold text-gray-800 mt-2">Status:</p>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-blue-50 text-blue-700">
                  {invoiceData.order.status}
                </span>
              </div>
            </div>

            <div className="border rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b text-xs text-gray-500 uppercase">
                    <th className="p-3">Product</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Price</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {invoiceData.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-medium text-gray-800">{item.name}</td>
                      <td className="p-3 text-center">{item.quantity}</td>
                      <td className="p-3 text-right">${Number(item.price).toFixed(2)}</td>
                      <td className="p-3 text-right font-bold text-indigo-600">
                        ${(Number(item.price) * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center border-t pt-4">
              <span className="text-base font-bold text-gray-800">Total Amount:</span>
              <span className="text-2xl font-extrabold text-indigo-600">
                ${Number(invoiceData.order.total_amount).toFixed(2)}
              </span>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold shadow-md transition-all text-sm"
            >
              Print / Save Invoice
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
