import React, { useEffect, useState } from "react";
import { User, MapPin, Plus, Trash2, CheckCircle, AlertCircle, Settings as SettingsIcon } from "lucide-react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function Settings() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showAddAddress, setShowAddAddress] = useState(false);
  const [formData, setFormData] = useState({
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

  useEffect(() => {
    fetchProfileAndAddresses();
  }, []);

  const fetchProfileAndAddresses = async () => {
    try {
      setLoading(true);
      const [profileRes, addressRes] = await Promise.all([
        api.get("/auth/profile"),
        api.get("/auth/address"),
      ]);
      setProfile(profileRes.data.user);
      setAddresses(addressRes.data.addresses || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load account settings");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await api.post("/auth/address", formData);
      setMessage("Address added successfully!");
      setShowAddAddress(false);
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
      fetchProfileAndAddresses();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save address");
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    try {
      await api.delete(`/auth/address/${id}`);
      setMessage("Address deleted successfully!");
      fetchProfileAndAddresses();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete address");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-gray-500 animate-pulse text-lg">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <span className="font-medium">{message}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Personal Details Card */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center space-x-3 border-b pb-4">
          <User className="h-6 w-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">Personal Details</h2>
        </div>

        {profile && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div>
              <span className="text-xs text-gray-500 block uppercase font-semibold">Email Address</span>
              <span className="text-gray-900 font-medium text-base">{profile.email}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block uppercase font-semibold">Account Role</span>
              <span className="inline-block mt-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full font-bold uppercase text-xs">
                {profile.role}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block uppercase font-semibold">Verification Status</span>
              <span className={`inline-block mt-1 font-semibold ${profile.is_verified ? "text-green-600" : "text-amber-600"}`}>
                {profile.is_verified ? "Verified Account" : "Unverified"}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block uppercase font-semibold">Member Since</span>
              <span className="text-gray-800">{new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Address Book Card */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center space-x-3">
            <MapPin className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Saved Delivery Addresses</h2>
          </div>
          <button
            onClick={() => setShowAddAddress(!showAddAddress)}
            className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>{showAddAddress ? "Cancel" : "Add Address"}</span>
          </button>
        </div>

        {showAddAddress && (
          <form onSubmit={handleAddAddress} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4">
            <h3 className="font-bold text-gray-800 text-sm">New Address Form</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Full Name"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="p-3 bg-white border border-gray-300 rounded-xl text-sm"
              />
              <input
                type="text"
                placeholder="Phone Number"
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="p-3 bg-white border border-gray-300 rounded-xl text-sm"
              />
              <input
                type="text"
                placeholder="Address Line 1"
                required
                value={formData.addressLine1}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                className="sm:col-span-2 p-3 bg-white border border-gray-300 rounded-xl text-sm"
              />
              <input
                type="text"
                placeholder="Address Line 2 (Optional)"
                value={formData.addressLine2}
                onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                className="sm:col-span-2 p-3 bg-white border border-gray-300 rounded-xl text-sm"
              />
              <input
                type="text"
                placeholder="City"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="p-3 bg-white border border-gray-300 rounded-xl text-sm"
              />
              <input
                type="text"
                placeholder="State"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="p-3 bg-white border border-gray-300 rounded-xl text-sm"
              />
              <input
                type="text"
                placeholder="Postal Code"
                required
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="p-3 bg-white border border-gray-300 rounded-xl text-sm"
              />
              <input
                type="text"
                placeholder="Country"
                required
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="p-3 bg-white border border-gray-300 rounded-xl text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isDefault" className="text-sm text-gray-700 font-medium">Set as default shipping address</label>
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold shadow-md text-sm transition-all"
            >
              Save Address
            </button>
          </form>
        )}

        {addresses.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">No saved delivery addresses found. Add one above.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div key={addr.id} className="bg-gray-50 p-5 rounded-2xl border border-gray-200 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{addr.full_name}</span>
                    {addr.is_default && (
                      <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full font-bold">Default</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">
                    {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ""}, {addr.city}, {addr.state} - {addr.postal_code}, {addr.country}
                  </p>
                  <p className="text-xs text-gray-500">Phone: {addr.phone_number}</p>
                </div>
                <div className="flex justify-end pt-2 border-t border-gray-200">
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="flex items-center space-x-1 text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
