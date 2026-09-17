import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuthStore } from "../store/authStore";

export default function LoginSignup() {
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter OTP
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [validationError, setValidationError] = useState("");

  const { sendOtp, verifyOtp, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setValidationError("");
    clearError();

    if (!email || !email.includes("@")) {
      setValidationError("Please enter a valid email address.");
      return;
    }

    const success = await sendOtp(email);
    if (success) {
      setStep(2);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setValidationError("");
    clearError();

    if (!otpCode || otpCode.length !== 6) {
      setValidationError("OTP must be exactly 6 digits.");
      return;
    }

    const success = await verifyOtp(email, otpCode);
    if (success) {
      navigate("/");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            {step === 1 ? "Welcome to NexusShop" : "Verify OTP"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 1
              ? "Enter your email to sign in or create an account instantly."
              : `We sent a 6-digit verification code to ${email}`}
          </p>
        </div>

        {(validationError || error) && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700">{validationError || error}</div>
          </div>
        )}

        {step === 1 ? (
          <form className="mt-8 space-y-6" onSubmit={handleSendOtp}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md transition-all disabled:opacity-50"
            >
              {loading ? "Sending OTP..." : "Continue with Email"}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyOtp}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                6-Digit Verification Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  maxLength="6"
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-400 text-gray-900 tracking-widest text-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Check your email inbox or backend logs for the OTP code.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3 px-4 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 group relative flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md transition-all disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Login"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
