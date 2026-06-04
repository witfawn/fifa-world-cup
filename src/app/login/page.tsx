"use client";

import { signIn } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FifaTrophy } from "@/components/FifaTrophy";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "authenticated") {
    return null;
  }

  const handleMagicLink = async () => {
    if (!email.trim()) return;
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        setSent(true);
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch {
      setError("Failed to send login link.");
    }

    setSending(false);
  };

  return (
    <div className="min-h-screen bg-pattern flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
          }}
          className="rounded-2xl p-8 shadow-2xl"
        >
          {/* Logo / Brand */}
          <div className="text-center mb-8">
            {/* Trophy icon */}
            <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(212, 168, 67, 0.12)" }}
            >
              <FifaTrophy size={32} />
            </div>

            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--foreground)" }}
            >
              Bangers
            </h1>
            <p
              className="text-sm mt-1 font-medium tracking-widest uppercase"
              style={{ color: "var(--gold)" }}
            >
              FIFA World Cup 2026
            </p>
          </div>

          {/* Description */}
          <p
            className="text-center text-sm mb-8 leading-relaxed"
            style={{ color: "var(--muted)" }}
          >
            Predict match outcomes, climb the leaderboard, and prove you know
            the beautiful game.
          </p>

          {/* Google Sign-In Button */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: "var(--gold)",
              color: "#0a0f1a",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
            <span className="text-xs" style={{ color: "var(--muted)" }}>or</span>
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
          </div>

          {/* Magic Link Form */}
          {!sent ? (
            <div>
              <label
                className="block text-xs font-medium mb-2 uppercase tracking-wider"
                style={{ color: "var(--muted)" }}
              >
                Sign in with email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 px-4 py-3 rounded-lg text-sm outline-none transition-colors"
                  style={{
                    backgroundColor: "var(--navy-light)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "var(--gold)")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "var(--border)")
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleMagicLink()}
                />
                <button
                  onClick={handleMagicLink}
                  disabled={sending || !email.trim()}
                  className="px-5 py-3 rounded-lg text-sm font-medium transition-all"
                  style={{
                    backgroundColor: sending || !email.trim() ? "var(--navy-light)" : "var(--surface-hover)",
                    color: sending || !email.trim() ? "var(--muted)" : "var(--foreground)",
                    border: "1px solid var(--border)",
                    cursor: sending || !email.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  {sending ? "..." : "Send link"}
                </button>
              </div>
              {error && (
                <p className="text-xs mt-2" style={{ color: "var(--danger)" }}>
                  {error}
                </p>
              )}
            </div>
          ) : (
            <div
              className="rounded-xl p-4 text-center"
              style={{
                backgroundColor: "rgba(48, 164, 108, 0.08)",
                border: "1px solid rgba(48, 164, 108, 0.2)",
              }}
            >
              <p className="text-sm font-medium" style={{ color: "var(--success)" }}>
                ✓ Login link sent!
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                Check your email and click the link to sign in.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="text-xs mt-3 underline"
                style={{ color: "var(--gold)" }}
              >
                Send another link
              </button>
            </div>
          )}
        </div>

        {/* Footer text */}
        <p
          className="text-center text-xs mt-6"
          style={{ color: "var(--muted)" }}
        >
          FIFA World Cup 2026 &middot; Bangers
        </p>
      </div>
    </div>
  );
}
