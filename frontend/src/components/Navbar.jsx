import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Package, LogOut, User, ShieldCheck, Settings } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../store/cartStore";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { cart } = useCartStore();
  const navigate = useNavigate();

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-2 text-indigo-600 font-bold text-xl">
            <Package className="h-7 w-7" />
            <span>NexusShop</span>
          </Link>
          <nav className="hidden md:flex space-x-6">
            <Link to="/" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
              Products
            </Link>
            {isAuthenticated && (
              <Link to="/orders" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                My Orders
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center space-x-6">
          {isAuthenticated ? (
            <>
              <Link
                to="/cart"
                className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors flex items-center space-x-1"
              >
                <ShoppingCart className="h-6 w-6" />
                <span className="font-medium hidden sm:inline">Cart</span>
                {totalCartItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {totalCartItems}
                  </span>
                )}
              </Link>

              <Link
                to="/settings"
                className="p-2 text-gray-600 hover:text-indigo-600 transition-colors"
                title="Account Settings"
              >
                <Settings className="h-6 w-6" />
              </Link>

              <div className="flex items-center space-x-3 border-l pl-6 border-gray-200">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-sm font-semibold text-gray-800">{user?.email}</span>
                  <span className="text-xs text-indigo-600 capitalize font-medium flex items-center justify-end space-x-1">
                    <ShieldCheck className="h-3 w-3 inline" />
                    <span>{user?.role || "customer"}</span>
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-600 hover:text-red-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-sm font-medium hidden sm:inline">Logout</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="text-gray-600 hover:text-indigo-600 px-4 py-2 text-sm font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                to="/login"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
