"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { VENMO_LINK, ENTRY_FEE } from "@/lib/config";

type PaymentStatus = "pending" | "confirmed" | "rejected" | null;

interface Payment {
  id: string;
  status: PaymentStatus;
  venmoNote: string | null;
  createdAt: string;
}

export default function PaymentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [venmoNote, setVenmoNote] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/payment")
        .then((res) => {
          if (res.ok) return res.json();
          return null;
        })
        .then((data: Payment | null) => {
          setPayment(data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [status, router]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venmoNote: venmoNote || null }),
      });

      if (res.ok) {
        const data: Payment = await res.json();
        setPayment(data);
        setMessage({ type: "success", text: "Payment submitted! Awaiting confirmation." });
        setVenmoNote("");
      } else {
        const err = await res.json().catch(() => null);
        setMessage({
          type: "error",
          text: err?.error || "Failed to submit payment. Please try again.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--gold)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!session) return null;

  const statusBadge = (s: PaymentStatus) => {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
      pending: {
        bg: "rgba(212, 168, 67, 0.15)",
        color: "#d4a843",
        label: "⏳ Pending",
      },
      confirmed: {
        bg: "rgba(34, 197, 94, 0.15)",
        color: "#22c55e",
        label: "✓ Confirmed",
      },
      rejected: {
        bg: "rgba(239, 68, 68, 0.15)",
        color: "#ef4444",
        label: "✗ Rejected",
      },
    };
    if (!s) return null;
    const style = styles[s];
    return (
      <span
        className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
        style={{ backgroundColor: style.bg, color: style.color }}
      >
        {style.label}
      </span>
    );
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      <Header />

      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
        {/* Entry Fee Card */}
        <div
          className="rounded-2xl p-6 mb-4"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: "var(--foreground)" }}
          >
            💰 Entry Fee
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
            Pay to join the FIFA World Cup Prediction Game
          </p>

          <div className="flex items-center justify-between mb-2">
            <span
              className="text-sm font-medium"
              style={{ color: "var(--muted)" }}
            >
              Amount
            </span>
            <span
              className="text-3xl font-extrabold"
              style={{ color: "var(--gold)" }}
            >
              ${ENTRY_FEE}
            </span>
          </div>

          {/* Payment status */}
          {payment && (
            <div
              className="mt-4 p-4 rounded-lg"
              style={{
                backgroundColor: "var(--navy-light)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--muted)" }}
                >
                  Payment Status
                </span>
                {statusBadge(payment.status)}
              </div>
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <div
            className="rounded-lg p-3 mb-4"
            style={{
              backgroundColor:
                message.type === "success"
                  ? "rgba(34, 197, 94, 0.1)"
                  : "rgba(239, 68, 68, 0.1)",
              border: `1px solid ${message.type === "success" ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
            }}
          >
            <p
              className="text-sm"
              style={{
                color: message.type === "success" ? "#22c55e" : "#ef4444",
              }}
            >
              {message.text}
            </p>
          </div>
        )}

        {/* Venmo Payment Button */}
        <div
          className="rounded-2xl p-6 mb-4"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <h2
            className="text-sm font-bold uppercase tracking-wider mb-4"
            style={{ color: "var(--gold)" }}
          >
            📲 Pay via Venmo
          </h2>
          <a
            href={VENMO_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center px-6 py-3 rounded-lg text-sm font-semibold transition-all mb-4"
            style={{
              backgroundColor: "var(--gold)",
              color: "var(--background)",
            }}
          >
            Open Venmo
          </a>
        </div>

        {/* Instructions */}
        <div
          className="rounded-2xl p-6 mb-4"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <h2
            className="text-sm font-bold uppercase tracking-wider mb-4"
            style={{ color: "var(--gold)" }}
          >
            📋 Payment Instructions
          </h2>
          <ol className="text-sm space-y-3" style={{ color: "var(--muted)" }}>
            <li className="flex items-start gap-3">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                style={{
                  backgroundColor: "rgba(212, 168, 67, 0.15)",
                  color: "var(--gold)",
                }}
              >
                1
              </span>
              <span>
                Click <strong style={{ color: "var(--foreground)" }}>Open Venmo</strong> above to send your payment
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                style={{
                  backgroundColor: "rgba(212, 168, 67, 0.15)",
                  color: "var(--gold)",
                }}
              >
                2
              </span>
              <span>
                Send <strong style={{ color: "var(--foreground)" }}>${ENTRY_FEE}</strong> to the Venmo account
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                style={{
                  backgroundColor: "rgba(212, 168, 67, 0.15)",
                  color: "var(--gold)",
                }}
              >
                3
              </span>
              <span>
                Come back here and click <strong style={{ color: "var(--foreground)" }}>I&apos;ve Paid</strong> below
              </span>
            </li>
          </ol>
        </div>

        {/* Submit Payment / Re-submit */}
        {(!payment || payment.status === "rejected") && (
          <div
            className="rounded-2xl p-6 mb-4"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <h2
              className="text-sm font-bold uppercase tracking-wider mb-4"
              style={{ color: "var(--gold)" }}
            >
              ✓ I&apos;ve Paid
            </h2>
            <div className="mb-4">
              <label
                className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
                style={{ color: "var(--muted)" }}
              >
                Venmo Note{" "}
                <span style={{ opacity: 0.5 }}>(optional)</span>
              </label>
              <input
                type="text"
                value={venmoNote}
                onChange={(e) => setVenmoNote(e.target.value)}
                placeholder="e.g. Your Venmo username or note"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors"
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
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full px-6 py-3 rounded-lg text-sm font-semibold transition-all"
              style={{
                backgroundColor: submitting
                  ? "var(--navy-light)"
                  : "var(--gold)",
                color: submitting ? "var(--muted)" : "var(--background)",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting
                ? "Submitting..."
                : payment?.status === "rejected"
                  ? "Re-submit Payment"
                  : "I've Paid"}
            </button>
          </div>
        )}

        {/* Pending payment info */}
        {payment?.status === "pending" && (
          <div
            className="rounded-2xl p-5 mb-4"
            style={{
              backgroundColor: "rgba(212, 168, 67, 0.08)",
              border: "1px solid rgba(212, 168, 67, 0.15)",
            }}
          >
            <p className="text-xs" style={{ color: "var(--gold)" }}>
              💡 Payment status may not update immediately and requires an admin step. Please check back later.
            </p>
          </div>
        )}

        {/* Confirmed note */}
        {payment?.status === "confirmed" && (
          <div
            className="rounded-2xl p-5 mb-4"
            style={{
              backgroundColor: "rgba(34, 197, 94, 0.08)",
              border: "1px solid rgba(34, 197, 94, 0.15)",
            }}
          >
            <p className="text-xs" style={{ color: "#22c55e" }}>
              🎉 Your payment is confirmed! You&apos;re all set to make predictions.
            </p>
          </div>
        )}

        {/* General admin note */}
        <div
          className="mt-4 p-3 rounded-lg"
          style={{
            backgroundColor: "rgba(212, 168, 67, 0.06)",
            border: "1px solid rgba(212, 168, 67, 0.1)",
          }}
        >
          <p className="text-xs text-center" style={{ color: "var(--muted)" }}>
            Payment status may not update immediately and requires an admin step.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
