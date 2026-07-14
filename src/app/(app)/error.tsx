"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isForbidden = error.message.includes("Owner") || error.message.includes("Manager") || error.message.includes("authorized");

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-3">
      <div className="text-center max-w-sm">
        {isForbidden ? (
          <>
            <h1 className="text-2xl font-semibold text-forest">Access Restricted</h1>
            <p className="text-charcoal opacity-70 mt-2">
              You don't have permission to view this page. If you think this is wrong, ask your shop owner.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-forest">Something Went Wrong</h1>
            <p className="text-charcoal opacity-70 mt-2">
              An unexpected error occurred. You can try again, or head back to the dashboard.
            </p>
          </>
        )}
        <div className="flex gap-3 justify-center mt-6">
          <button onClick={reset} className="bg-gold text-charcoal font-semibold px-4 py-2 rounded">
            Try Again
          </button>
          <a href="/dashboard" className="bg-forest text-cream font-semibold px-4 py-2 rounded">
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}