"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import { FifaTrophy } from "@/components/FifaTrophy";

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
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left: logo + name */}
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              <FifaTrophy size={28} />
            </div>
            <span
              className="font-semibold text-sm"
              style={{ color: "var(--foreground)" }}
            >
              Bangers WC 2026
            </span>
          </div>

          {/* Right: avatar + sign out */}
          <div className="flex items-center gap-3">
            <Avatar
              image={profile.image}
              name={profile.name}
              color={profile.avatarColor}
              size={32}
              className="ring-2 ring-gray-700"
              onClick={() => router.push("/profile")}
            />
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-[10px] font-medium transition-colors leading-tight text-center"
              style={{ color: "var(--muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
            >
              Sign<br />out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div
          className="rounded-2xl p-6"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <h1
            className="text-2xl sm:text-3xl font-bold mb-2"
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
              className="mt-6 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
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
                className="px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
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
