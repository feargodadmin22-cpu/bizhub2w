"use client";

import { useState } from "react";
import { requestPasswordReset } from "@/server/actions/password-reset";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await requestPasswordReset(email);
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-3">
      <div className="w-full max-w-sm">
        <div className="bg-forest text-cream p-3 rounded mb-3">
          <h1 className="text-lg font-semibold">Business Hub</h1>
          <p className="text-sm opacity-90">Reset your password</p>
        </div>

       {submitted ? (
          <div className="bg-white p-3 rounded space-y-3">
            <p className="text-charcoal">
              If an account exists with that email, a reset link has been sent. Check your inbox (and spam folder).
            </p>
            <a href="/login" className="text-forest font-semibold text-sm block">
              Back to login
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-3 rounded space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-charcoal">Email</span>
              <input
                required
                type="email"
                className="input mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold text-charcoal font-semibold p-3 rounded disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}
      </div>

      <style>{`
        .input {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: white;
          color: #1f1f1f;
        }
      `}</style>
    </div>
  );
}