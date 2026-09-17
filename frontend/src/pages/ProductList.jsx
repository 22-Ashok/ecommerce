import React, { useEffect, useState } from "react";
import { Search, ShoppingBag, AlertCircle, CheckCircle, Plus } from "lucide-react";
import api from "../services/api";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const { addToCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/catalog/categories");
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const url = selectedCategory ? `/catalog/products?categoryId=${selectedCategory}` : "/catalog/products";
      const res = await api.get(url);
      setProducts(res.data.products || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    try {
      await addToCart(product.id, 1);
      setSuccessMessage(`Added "${product.name}" to cart!`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add to cart");
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 sm:p-12 text-white mb-10 shadow-xl flex flex-col md:flex-row items-center justify-between">
        <div className="space-y-4 max-w-xl mb-6 md:mb-0">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Discover Next-Gen Products
          </h1>
          <p className="text-indigo-100 text-base sm:text-lg">
            Explore our curated catalog of high-quality items backed by high-performance microservices and Nginx API Gateway.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center">
          <span className="block text-3xl font-bold">{products.length}</span>
          <span className="text-xs uppercase tracking-wider text-indigo-200">Active Products</span>
        </div>
      </div>

      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center space-x-2 shadow-sm">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={fetchProducts} className="ml-auto underline text-sm font-semibold">Retry</button>
        </div>
      )}

      {/* Flipkart-style Category Navigation Bar & Search Bar */}
      <div className="mb-8 space-y-4">
        {/* Category Tabs */}
        <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all shadow-sm ${
              selectedCategory === ""
                ? "bg-indigo-600 text-white shadow-indigo-200 shadow-md"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all shadow-sm ${
                selectedCategory === cat.id
                  ? "bg-indigo-600 text-white shadow-indigo-200 shadow-md"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name or description..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-6 h-96 animate-pulse border border-gray-200 flex flex-col justify-between">
              <div className="bg-gray-200 h-48 rounded-xl mb-4"></div>
              <div className="space-y-2">
                <div className="bg-gray-200 h-5 w-3/4 rounded"></div>
                <div className="bg-gray-200 h-4 w-1/2 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 shadow-sm">
          <ShoppingBag className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-800">No products found</h3>
          <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
            >
              {/* Product Image Container */}
              <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
                <img
                  src={product.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"}
                  alt={product.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500";
                  }}
                />
                {product.category_name && (
                  <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full font-medium">
                    {product.category_name}
                  </span>
                )}
                <span
                  className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold ${
                    product.stock > 0
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : "bg-red-100 text-red-800 border border-red-200"
                  }`}
                >
                  {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                </span>
              </div>

              {/* Product Info */}
              <div className="p-6 flex flex-col flex-grow justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2 line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                    {product.description || "No description provided."}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-500 block">Price</span>
                  <span className="text-2xl font-extrabold text-indigo-600">
                    {Number(product.price).toFixed(2)}
                  </span>
                  </div>
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock <= 0}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
