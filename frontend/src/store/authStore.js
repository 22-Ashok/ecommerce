import { create } from "zustand";
import api from "../services/api";

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem("user")) || null,
  accessToken: localStorage.getItem("accessToken") || null,
  isAuthenticated: !!localStorage.getItem("accessToken"),
  loading: false,
  error: null,

  sendOtp: async (email) => {
    set({ loading: true, error: null });
    try {
      await api.post("/auth/send-otp", { email });
      set({ loading: false });
      return true;
    } catch (err) {
      set({
        loading: false,
        error: err.response?.data?.error || err.message || "Failed to send OTP",
      });
      return false;
    }
  },

  verifyOtp: async (email, otpCode) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post("/auth/verify-otp", { email, otpCode });
      const { user, accessToken, refreshToken } = response.data;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));

      set({
        user,
        accessToken,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
      return true;
    } catch (err) {
      set({
        loading: false,
        error: err.response?.data?.error || err.message || "Verification failed",
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null }),
}));
