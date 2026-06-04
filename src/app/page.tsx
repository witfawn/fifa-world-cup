"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";

interface Profile {
  id: string;
  email: string;
  name: string;
  image: string | null;
  phone: string | null;
  avatarColor: string | null;
  profileComplete: boolean;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data: Profile) => {
          setProfile(data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--gold)", borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!session || !profile) return null;

  const firstName = profile.name?.split(" ")[0] || "there";

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Top bar */}
      <header
        className="border-b"
        style={{
          backgroundColor: "var(--navy)",
          borderColor: "var(--border)",
        }}
      >
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Trophy icon */}
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "rgba(212, 168, 67, 0.12)" }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--gold)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
              </svg>
            </div>
            <span
              className="font-semibold text-sm"
              style={{ color: "var(--foreground)" }}
            >
              Bangers
            </span>
            <span
              className="text-xs font-medium tracking-wider uppercase"
              style={{ color: "var(--gold)" }}
            >
              FIFA World Cup
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Clickable avatar → profile */}
            <Avatar
              image={profile.image}
              name={profile.name}
              color={profile.avatarColor}
              size={32}
              className="ring-2 ring-gray-700"
              onClick={() => router.push("/profile")}
            />

            {/* Sign out */}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-4 py-2 text-xs font-medium rounded-lg transition-colors"
              style={{
                color: "var(--muted)",
                border: "1px solid var(--border)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--surface-hover)";
                e.currentTarget.style.color = "var(--foreground)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--muted)";
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: "var(--foreground)" }}
          >
            Hello, {firstName} 👋
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Welcome to Bangers FIFA World Cup 2026.
          </p>

          {/* Profile nudge if incomplete */}
          {!profile.profileComplete && (
            <div
              className="mt-6 rounded-xl p-4 flex items-center justify-between"
              style={{
                backgroundColor: "rgba(212, 168, 67, 0.08)",
                border: "1px solid rgba(212, 168, 67, 0.2)",
              }}
            >
              <p className="text-sm" style={{ color: "var(--gold)" }}>
                Complete your profile to get started!
              </p>
              <button
                onClick={() => router.push("/profile")}
                className="px-4 py-2 text-xs font-semibold rounded-lg transition-colors"
                style={{
                  backgroundColor: "var(--gold)",
                  color: "var(--background)",
                }}
              >
                Set up profile
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
