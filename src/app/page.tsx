import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-3 relative">
      {" "}
      <div className="text-center max-w-sm">
        <h1 className="text-2xl font-semibold text-forest">Business Hub</h1>
        <p className="text-charcoal opacity-70 mt-1">
          Track inventory. See real profit.
        </p>

        <div className="flex flex-col gap-3 mt-6">
          <Link
            href="/login"
            className="bg-gold text-charcoal font-semibold p-3 rounded"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="bg-forest text-cream font-semibold p-3 rounded"
          >
            Create Shop Account
          </Link>
          <Link
            href="/staff-login"
            className="text-forest font-semibold text-sm mt-2"
          >
            Staff invite code
          </Link>
        </div>
      </div>
      <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-charcoal opacity-50">
        Powered by Mmiri28
      </p>
    </div>
  );
}
