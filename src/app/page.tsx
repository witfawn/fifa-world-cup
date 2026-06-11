"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { getTeamFlag } from "@/lib/teams";
import {
  getAllMatches,
  getUpcomingMatches,
  formatKickoff,
  formatCountdown,
} from "@/lib/schedule";

const TOTAL_MATCHES = 72;

interface Profile {
  id: string;
  email: string;
  name: string;
  image: string | null;
  phone: string | null;
  avatarColor: string | null;
  profileComplete: boolean;
}

interface Prediction {
  id: string;
  userId: string;
  matchId: number;
  homeScore: number | null;
  awayScore: number | null;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  totalPoints: number;
  rank: number;
}

/** Format today's date as YYYY-MM-DD in Pacific Time */
function getTodayPT(): string {
  const now = new Date();
  // Pacific Time offset: PDT is UTC-7, PST is UTC-8
  // Use a simple approach: format in PT
  const ptStr = now.toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
  });
  return ptStr; // Returns YYYY-MM-DD
}

/** Format match time for today's games display */
function formatTime(timePt: string): string {
  return timePt;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [matchResults, setMatchResults] = useState<Record<number, { homeScore: number; awayScore: number; isLocked: boolean }>>({});

  const fetchAllData = useCallback(() => {
    if (status === "authenticated") {
      Promise.all([
        fetch("/api/profile").then((res) => res.json()),
        fetch("/api/predictions").then((res) => res.json()),
        fetch(`/api/leaderboard?t=${Date.now()}`).then((res) => res.json()),
        fetch("/api/payment")
          .then((res) => res.json())
          .catch(() => ({ payment: null })),
        fetch(`/api/results?t=${Date.now()}`)
          .then((res) => res.json())
          .catch(() => []),
      ])
        .then(([profileData, predsData, leaderboardData, paymentData, resultsData]) => {
          setProfile(profileData);
          setPredictions(predsData);
          if (paymentData?.payment?.status) {
            setPaymentStatus(paymentData.payment.status);
          }
          const currentUserId = (session?.user as { id: string })?.id;
          const entry = leaderboardData.leaderboard?.find(
            (e: LeaderboardEntry) => e.id === currentUserId
          );
          if (entry) setRank(entry.rank);
          // Build results lookup
          const rMap: Record<number, { homeScore: number; awayScore: number; isLocked: boolean }> = {};
          for (const r of resultsData) {
            rMap[r.matchId] = { homeScore: r.homeScore, awayScore: r.awayScore, isLocked: r.isLocked };
          }
          setMatchResults(rMap);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, session]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    fetchAllData();
  }, [status, router, fetchAllData]);

  // Auto-refresh when user switches back to this tab
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && status === "authenticated") {
        fetchAllData();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [status, fetchAllData]);

  if (status === "loading" || loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{
              borderColor: "var(--gold)",
              borderTopColor: "transparent",
            }}
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
  const upcoming = getUpcomingMatches();
  const nextMatch = upcoming.length > 0 ? upcoming[0] : null;

  // Find today's games (in PT timezone)
  const todayPT = getTodayPT();
  const allMatches = getAllMatches();
  const todaysGames = allMatches.filter((m) => m.date === todayPT);

  // Prediction stats
  const pickedCount = predictions.filter(
    (p) => p.homeScore !== null && p.awayScore !== null
  ).length;

  // Is tournament started? (first match was June 11, 2026)
  const tournamentStart = new Date("2026-06-11T16:00:00Z"); // 9 AM PT
  const isTournamentStarted = new Date() >= tournamentStart;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* Greeting */}
        <div className="mb-5">
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--foreground)" }}
          >
            Hello, {firstName} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Welcome to Bangers FIFA World Cup 2026
          </p>
        </div>

        {/* Profile nudge */}
        {!profile.profileComplete && (
          <div
            className="rounded-2xl p-4 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
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

        {/* Payment nudge */}
        {paymentStatus !== "confirmed" && (
          <div
            className="rounded-2xl p-4 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
            }}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: "#ef4444" }}>
                💰 Payment required
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                $100 entry fee · Pay when you&apos;re ready
              </p>
            </div>
            <button
              onClick={() => router.push("/payment")}
              className="px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
              style={{
                backgroundColor: "#ef4444",
                color: "#fff",
              }}
            >
              Pay Now →
            </button>
          </div>
        )}

        {/* Card 1: Next Match or Today's Games */}
        {!isTournamentStarted && nextMatch ? (
          <div
            className="rounded-2xl p-5 mb-4"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <h2
              className="text-xs font-bold uppercase tracking-wider mb-4"
              style={{ color: "var(--muted)" }}
            >
              ⏰ Next Match
            </h2>

            <div className="flex items-center justify-center gap-4 mb-3">
              {/* Home team */}
              <div className="text-center">
                <div className="text-3xl mb-1">
                  {getTeamFlag(nextMatch.home)}
                </div>
                <div
                  className="text-sm font-semibold"
                  style={{ color: "var(--foreground)" }}
                >
                  {nextMatch.home.length > 10
                    ? nextMatch.home.split(" ").pop()
                    : nextMatch.home}
                </div>
              </div>

              <div
                className="text-lg font-bold"
                style={{ color: "var(--muted)" }}
              >
                vs
              </div>

              {/* Away team */}
              <div className="text-center">
                <div className="text-3xl mb-1">
                  {getTeamFlag(nextMatch.away)}
                </div>
                <div
                  className="text-sm font-semibold"
                  style={{ color: "var(--foreground)" }}
                >
                  {nextMatch.away.length > 10
                    ? nextMatch.away.split(" ").pop()
                    : nextMatch.away}
                </div>
              </div>
            </div>

            <div className="text-center mb-1">
              <div className="text-sm" style={{ color: "var(--foreground)" }}>
                {formatKickoff(nextMatch.date, nextMatch.time_pt)}
              </div>
            </div>
            <div className="text-center mb-4">
              <span
                className="text-xs font-semibold px-2 py-1 rounded-full"
                style={{
                  backgroundColor: "rgba(48, 164, 108, 0.15)",
                  color: "var(--success)",
                }}
              >
                {formatCountdown(nextMatch.date, nextMatch.time_pt)}
              </span>
            </div>

            <button
              onClick={() => router.push("/predict")}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all text-center"
              style={{
                backgroundColor: "var(--gold)",
                color: "var(--background)",
              }}
            >
              Make Prediction →
            </button>
          </div>
        ) : isTournamentStarted && todaysGames.length > 0 ? (
          <div
            className="rounded-2xl p-5 mb-4"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: "var(--muted)" }}
              >
                🔥 Today&apos;s Games
              </h2>
              <button
                onClick={() => router.push("/predict")}
                className="text-xs font-medium"
                style={{ color: "var(--gold)" }}
              >
                View All →
              </button>
            </div>

            <div className="space-y-3">
              {todaysGames.map((match) => {
                const result = matchResults[match.id];
                return (
                <div
                  key={match.id}
                  className="flex items-center justify-between py-2"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-lg">{getTeamFlag(match.home)}</span>
                    <span
                      className="text-sm font-medium truncate"
                      style={{ color: "var(--foreground)" }}
                    >
                      {match.home.length > 10
                        ? match.home.split(" ").pop()
                        : match.home}
                    </span>
                  </div>
                  <div className="flex-shrink-0 mx-3">
                    {result ? (
                      <div className="text-center">
                        <span
                          className="text-base font-bold"
                          style={{ color: result.isLocked ? "var(--gold)" : "var(--foreground)" }}
                        >
                          {result.homeScore} — {result.awayScore}
                          {result.isLocked && <span className="text-[10px] ml-1">✓</span>}
                        </span>
                        {!result.isLocked && (
                          <div className="text-[9px] font-mono uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                            Not Final
                          </div>
                        )}
                      </div>
                    ) : (
                      <span
                        className="text-xs font-medium"
                        style={{ color: "var(--muted)" }}
                      >
                        {formatTime(match.time_pt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                    <span
                      className="text-sm font-medium truncate text-right"
                      style={{ color: "var(--foreground)" }}
                    >
                      {match.away.length > 10
                        ? match.away.split(" ").pop()
                        : match.away}
                    </span>
                    <span className="text-lg">{getTeamFlag(match.away)}</span>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        ) : isTournamentStarted ? (
          <div
            className="rounded-2xl p-5 mb-4"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <h2
              className="text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: "var(--muted)" }}
            >
              🔥 Today&apos;s Games
            </h2>
            <p
              className="text-sm text-center py-4"
              style={{ color: "var(--muted)" }}
            >
              No games today. Check back tomorrow!
            </p>
          </div>
        ) : null}

        {/* Card 2: Your Stats */}
        <div
          className="rounded-2xl p-5 mb-4"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <h2
            className="text-xs font-bold uppercase tracking-wider mb-4"
            style={{ color: "var(--muted)" }}
          >
            📊 Your Stats
          </h2>

          <div className="space-y-4">
            {/* Games picked */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-sm"
                  style={{ color: "var(--foreground)" }}
                >
                  Games picked
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: "var(--gold)" }}
                >
                  {pickedCount}/{TOTAL_MATCHES}
                </span>
              </div>
              <div
                className="w-full h-2.5 rounded-full overflow-hidden"
                style={{ backgroundColor: "var(--navy-light)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${TOTAL_MATCHES > 0 ? (pickedCount / TOTAL_MATCHES) * 100 : 0}%`,
                    backgroundColor: "var(--gold)",
                  }}
                />
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div
                className="rounded-xl p-3 text-center"
                style={{ backgroundColor: "var(--navy-light)" }}
              >
                <div
                  className="text-lg font-bold"
                  style={{ color: rank ? "var(--gold)" : "var(--muted)" }}
                >
                  {rank ? `#${rank}` : "—"}
                </div>
                <div
                  className="text-[10px] uppercase tracking-wider mt-1"
                  style={{ color: "var(--muted)" }}
                >
                  Current Rank
                </div>
              </div>
              <div
                className="rounded-xl p-3 text-center"
                style={{ backgroundColor: "var(--navy-light)" }}
              >
                <div
                  className="text-lg font-bold"
                  style={{ color: "var(--foreground)" }}
                >
                  0
                </div>
                <div
                  className="text-[10px] uppercase tracking-wider mt-1"
                  style={{ color: "var(--muted)" }}
                >
                  Total Points
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick action: Make predictions */}
        {!isTournamentStarted && (
          <div
            className="rounded-2xl p-5"
            style={{
              backgroundColor: "rgba(212, 168, 67, 0.06)",
              border: "1px solid rgba(212, 168, 67, 0.15)",
            }}
          >
            <div className="text-center">
              <p
                className="text-sm mb-3"
                style={{ color: "var(--foreground)" }}
              >
                The tournament kicks off June 11! Get your predictions in before
                each match locks.
              </p>
              <button
                onClick={() => router.push("/predict")}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={{
                  backgroundColor: "var(--gold)",
                  color: "var(--background)",
                }}
              >
                Make All Predictions →
              </button>
            </div>
          </div>
        )}

        {/* How to Play link */}
        <div
          className="rounded-2xl p-4 mt-4"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <button
            onClick={() => router.push("/rules")}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">📋</span>
              <div className="text-left">
                <div
                  className="text-sm font-medium"
                  style={{ color: "var(--foreground)" }}
                >
                  How to Play
                </div>
                <div
                  className="text-xs"
                  style={{ color: "var(--muted)" }}
                >
                  Scoring rules, tips, and instructions
                </div>
              </div>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--muted)"
              strokeWidth="2"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
