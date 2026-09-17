import { create } from "zustand";
import api from "../services/api";

export const useCartStore = create((set, get) => ({
  cart: [],
  loading: false,
  error: null,
  orderSuccessId: null,

  fetchCart: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get("/catalog/cart");
      set({ cart: res.data.cart || [], loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err.response?.data?.error || err.message || "Failed to fetch cart",
      });
    }
  },

  addToCart: async (productId, quantity = 1) => {
    set({ loading: true, error: null });
    try {
      await api.post("/catalog/cart", { productId, quantity });
      await get().fetchCart();
    } catch (err) {
      set({
        loading: false,
        error: err.response?.data?.error || err.message || "Failed to add item to cart",
      });
      throw err;
    }
  },

  removeFromCart: async (productId) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/catalog/cart/${productId}`);
      await get().fetchCart();
    } catch (err) {
      set({
        loading: false,
        error: err.response?.data?.error || err.message || "Failed to remove item",
      });
    }
  },

  checkout: async () => {
    set({ loading: true, error: null, orderSuccessId: null });
    try {
      const res = await api.post("/catalog/orders");
      const orderId = res.data.orderId;
      set({ orderSuccessId: orderId, cart: [], loading: false });
      return orderId;
    } catch (err) {
      set({
        loading: false,
        error: err.response?.data?.error || err.message || "Checkout failed",
      });
      throw err;
    }
  },

  clearOrderSuccess: () => set({ orderSuccessId: null }),
}));
