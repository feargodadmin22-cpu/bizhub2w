"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { redeemInvite } from "@/server/actions/auth";

export default function StaffLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ code: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await redeemInvite({
        code: form.code.trim().toUpperCase(),
        email: form.email,
        password: form.password,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not redeem invite");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-3">
      <div className="w-full max-w-sm">
        <div className="bg-forest text-cream p-3 rounded mb-3">
          <h1 className="text-lg font-semibold">Business Hub</h1>
          <p className="text-sm opacity-90">Activate your staff account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-3 rounded space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-charcoal">Invite code</span>
            <input
              required
              className="input mt-1 uppercase tracking-wider"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="e.g. A1B2C3D4"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-charcoal">Email</span>
            <input
              required
              type="email"
              className="input mt-1"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-charcoal">Choose a password</span>
            <input
              required
              type="password"
              minLength={8}
              className="input mt-1"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>

          {error && (
            <p className="text-sm text-red-700 bg-red-50 p-3 rounded">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-charcoal font-semibold p-3 rounded disabled:opacity-60"
          >
            {loading ? "Activating..." : "Activate account"}
          </button>
        </form>

        <p className="text-xs text-center mt-3 text-charcoal opacity-70">
          Invite codes expire 24hr after they're issued and can only be used once.
        </p>
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