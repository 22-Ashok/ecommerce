import React, { useEffect, useState } from "react";
import { MapPin, Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import api from "../services/api";

export default function AddressBook({ onSelectAddress, selectedAddressId }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    isDefault: true,
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await api.get("/auth/address");
      const list = res.data.addresses || [];
      setAddresses(list);
      if (list.length > 0 && !selectedAddressId && onSelectAddress) {
        onSelectAddress(list[0].id);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/address", formData);
      setFormData({
        fullName: "",
        phoneNumber: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
        isDefault: false,
      });
      setShowForm(false);
      await fetchAddresses();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save address");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/auth/address/${id}`);
      await fetchAddresses();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete address");
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
          <MapPin className="h-6 w-6 text-indigo-600" />
          <span>Shipping Address</span>
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>{showForm ? "Cancel" : "Add Address"}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAddAddress} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4">
          <h4 className="font-bold text-gray-800 text-sm">Add New Shipping Address</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="p-3 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              placeholder="Phone Number"
              required
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="p-3 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              placeholder="Address Line 1"
              required
              value={formData.addressLine1}
              onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
              className="sm:col-span-2 p-3 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              placeholder="Address Line 2 (Optional)"
              value={formData.addressLine2}
              onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
              className="sm:col-span-2 p-3 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              placeholder="City"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="p-3 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              placeholder="State"
              required
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="p-3 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              placeholder="Postal Code"
              required
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              className="p-3 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              placeholder="Country"
              required
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="p-3 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold shadow-md transition-all text-sm"
          >
            Save Address
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-gray-500 animate-pulse">Loading addresses...</p>
      ) : addresses.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <MapPin className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm font-medium text-gray-700">No shipping address saved yet.</p>
          <p className="text-xs text-gray-500 mt-1">Please add a shipping address before checkout.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              onClick={() => onSelectAddress && onSelectAddress(addr.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between ${
                selectedAddressId === addr.id
                  ? "border-indigo-600 bg-indigo-50/50 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-gray-900 text-sm">{addr.full_name}</span>
                  <span className="text-xs text-gray-500">({addr.phone_number})</span>
                  {addr.is_default && (
                    <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600">
                  {addr.address_line1} {addr.address_line2 ? `, ${addr.address_line2}` : ""}, {addr.city}, {addr.state} - {addr.postal_code}, {addr.country}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                {selectedAddressId === addr.id && (
                  <CheckCircle2 className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(addr.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete address"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
