import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import LoginSignup from "./pages/LoginSignup";
import ProductList from "./pages/ProductList";
import Cart from "./pages/Cart";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import { useAuthStore } from "./store/authStore";

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<ProductList />} />
            <Route path="/login" element={<LoginSignup />} />
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout/success"
              element={
                <ProtectedRoute>
                  <CheckoutSuccess />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
