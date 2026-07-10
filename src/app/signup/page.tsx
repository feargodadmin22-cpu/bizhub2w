"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signupShop } from "@/server/actions/auth";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    shopName: "",
    ownerName: "",
    ownerEmail: "",
    ownerContact: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signupShop(form);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-3">
      <div className="w-full max-w-sm">
        <div className="bg-forest text-cream p-3 rounded mb-3">
          <h1 className="text-lg font-semibold">Business Hub</h1>
          <p className="text-sm opacity-90">Create your shop account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-3 rounded space-y-3"
        >
          <label className="block">
            <span className="text-sm font-medium text-charcoal">Shop name</span>
            <input
              required
              className="input mt-1"
              value={form.shopName}
              onChange={(e) => setForm({ ...form, shopName: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-charcoal">Your name</span>
            <input
              required
              className="input mt-1"
              value={form.ownerName}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-charcoal">Email</span>
            <input
              required
              type="email"
              className="input mt-1"
              value={form.ownerEmail}
              onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-charcoal">
              Phone number
            </span>
            <input
              required
              className="input mt-1"
              value={form.ownerContact}
              onChange={(e) =>
                setForm({ ...form, ownerContact: e.target.value })
              }
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-charcoal">Password</span>
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
            <p className="text-sm text-red-700 bg-red-50 p-3 rounded">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-charcoal font-semibold p-3 rounded disabled:opacity-60"
          >
            {loading ? "Creating shop..." : "Create shop"}
          </button>
        </form>

        <p className="text-sm text-center mt-3 text-charcoal">
          Staff member?{" "}
          <a href="/staff-login" className="text-forest font-semibold">
            Redeem invite code
          </a>
        </p>
      </div>

      <style jsx global>{`
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
