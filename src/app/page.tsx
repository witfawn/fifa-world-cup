"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
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

  if (!session) {
    return null;
  }

  const firstName = session.user?.name?.split(" ")[0] || "there";

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
            {/* User info */}
            <div className="flex items-center gap-3">
              {session.user?.image && (
                <Image
                  src={session.user.image}
                  alt="Avatar"
                  width={32}
                  height={32}
                  className="rounded-full ring-2 ring-gray-700"
                />
              )}
              <span
                className="text-sm font-medium hidden sm:inline"
                style={{ color: "var(--foreground)" }}
              >
                {session.user?.name}
              </span>
            </div>

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

      {/* Main content - Profile placeholder */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Greeting */}
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: "var(--foreground)" }}
          >
            Hello, {firstName}
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Welcome to Bangers FIFA World Cup 2026.
          </p>

          {/* Profile preview card */}
          <div
            className="mt-8 rounded-xl p-6"
            style={{
              backgroundColor: "var(--navy-light)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center gap-5">
              {/* Profile picture */}
              <div className="relative group">
                {session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt="Profile"
                    width={80}
                    height={80}
                    className="rounded-full"
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
                    style={{
                      backgroundColor: "rgba(212, 168, 67, 0.15)",
                      color: "var(--gold)",
                    }}
                  >
                    {firstName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div
                  className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-1">
                <p
                  className="font-semibold"
                  style={{ color: "var(--foreground)" }}
                >
                  {session.user?.name}
                </p>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  {session.user?.email}
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--muted)", opacity: 0.6 }}
                >
                  Phone: Not set
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
