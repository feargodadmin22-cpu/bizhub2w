"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/server/actions/password-reset";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) return setError("Password must be at least 8 characters");
    if (password !== confirmPassword) return setError("Passwords don't match");

    setLoading(true);
    try {
      await resetPassword(token, password);
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-3">
        <p className="text-charcoal">Invalid reset link — no token provided.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-3">
      <div className="w-full max-w-sm">
        <div className="bg-forest text-cream p-3 rounded mb-3">
          <h1 className="text-lg font-semibold">Business Hub</h1>
          <p className="text-sm opacity-90">Choose a new password</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-3 rounded space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-charcoal">New password</span>
            <input
              required
              type="password"
              minLength={8}
              className="input mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-charcoal">Confirm password</span>
            <input
              required
              type="password"
              minLength={8}
              className="input mt-1"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>

          {error && <p className="text-sm text-red-700 bg-red-50 p-3 rounded">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-charcoal font-semibold p-3 rounded disabled:opacity-60"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}