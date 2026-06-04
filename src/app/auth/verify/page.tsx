"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No token provided.");
      return;
    }

    // Verify the token and sign in
    signIn("credentials", {
      redirect: false,
      token,
    }).then((result) => {
      if (result?.error) {
        setStatus("error");
        setMessage("Invalid or expired login link. Please request a new one.");
      } else {
        setStatus("success");
        setMessage("Logged in! Redirecting...");
        setTimeout(() => router.push("/"), 1000);
      }
    });
  }, [token, router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div
        className="rounded-2xl p-8 text-center max-w-sm w-full"
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        {status === "loading" && (
          <>
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4"
              style={{ borderColor: "var(--gold)", borderTopColor: "transparent" }}
            />
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Verifying your login link...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "rgba(48, 164, 108, 0.15)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              {message}
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "rgba(229, 72, 77, 0.15)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6M9 9l6 6" />
              </svg>
            </div>
            <p className="text-sm font-medium mb-4" style={{ color: "var(--danger)" }}>
              {message}
            </p>
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{
                backgroundColor: "var(--gold)",
                color: "var(--background)",
              }}
            >
              Back to login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--gold)", borderTopColor: "transparent" }} />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
