"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError("Incorrect email or password");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-3">
      <div className="w-full max-w-sm">
        <div className="bg-forest text-cream p-3 rounded mb-3">
          <h1 className="text-lg font-semibold">Business Hub</h1>
          <p className="text-sm opacity-90">Log in</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-3 rounded space-y-3"
        >
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
          <label className="block">
            <span className="text-sm font-medium text-charcoal">Password</span>
            <input
              required
              type="password"
              className="input mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="text-sm text-center mt-3 text-charcoal">
          New shop?{" "}
          <a href="/signup" className="text-forest font-semibold">
            Create an account
          </a>
          {" · "}
          <a href="/staff-login" className="text-forest font-semibold">
            Staff invite code
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
