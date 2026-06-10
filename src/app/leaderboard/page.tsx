"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";

interface LeaderboardEntry {
  id: string;
  name: string;
  image: string | null;
  avatarColor: string | null;
  predictionCount: number;
  totalPoints: number;
  rank: number;
  hasPaid: boolean;
}

interface CurrentUserPerformance {
  rank: number;
  points: number;
  picks: number;
  avgPerGame: number;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  totalPlayers: number;
  currentUser: CurrentUserPerformance | null;
}

function getMedal(rank: number): string | null {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

export default function LeaderboardPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const currentUserId = (session?.user as { id: string })?.id;

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/leaderboard")
        .then((res) => res.json())
        .then((d: LeaderboardResponse) => {
          setData(d);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: "var(--background)" }}
      >
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{
                borderColor: "var(--gold)",
                borderTopColor: "transparent",
              }}
            />
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Loading leaderboard...
            </p>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!session) return null;

  const leaderboard = data?.leaderboard || [];
  const currentUser = data?.currentUser;
  const totalPlayers = data?.totalPlayers || 0;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* Your Performance Card */}
        {currentUser && (
          <div
            className="rounded-2xl p-5 mb-5"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <h2
              className="text-xs font-bold uppercase tracking-wider mb-4"
              style={{ color: "var(--muted)" }}
            >
              📊 Your Performance
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div
                  className="text-2xl font-bold"
                  style={{ color: "var(--gold)" }}
                >
                  #{currentUser.rank}
                </div>
                <div
                  className="text-[10px] uppercase tracking-wider mt-1"
                  style={{ color: "var(--muted)" }}
                >
                  Rank
                </div>
              </div>
              <div className="text-center">
                <div
                  className="text-2xl font-bold"
                  style={{ color: "var(--foreground)" }}
                >
                  {currentUser.points}
                </div>
                <div
                  className="text-[10px] uppercase tracking-wider mt-1"
                  style={{ color: "var(--muted)" }}
                >
                  Points
                </div>
              </div>
              <div className="text-center">
                <div
                  className="text-2xl font-bold"
                  style={{ color: "var(--foreground)" }}
                >
                  {currentUser.picks}
                </div>
                <div
                  className="text-[10px] uppercase tracking-wider mt-1"
                  style={{ color: "var(--muted)" }}
                >
                  Picks
                </div>
              </div>
              <div className="text-center">
                <div
                  className="text-2xl font-bold"
                  style={{ color: "var(--foreground)" }}
                >
                  {currentUser.avgPerGame}
                </div>
                <div
                  className="text-[10px] uppercase tracking-wider mt-1"
                  style={{ color: "var(--muted)" }}
                >
                  Avg / Game
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <h2
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: "var(--muted)" }}
            >
              🏆 Leaderboard
            </h2>
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              {totalPlayers} player{totalPlayers !== 1 ? "s" : ""}
            </span>
          </div>

          {leaderboard.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-3xl mb-2">🏆</p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                No players yet. Be the first to sign up!
              </p>
            </div>
          ) : (
            <div>
              {leaderboard.map((entry) => {
                const isCurrentUser = entry.id === currentUserId;
                const medal = getMedal(entry.rank);

                return (
                  <div
                    key={entry.id}
                    className="px-5 py-3 flex items-center gap-3 transition-colors"
                    style={{
                      backgroundColor: isCurrentUser
                        ? "rgba(212, 168, 67, 0.08)"
                        : "transparent",
                      borderTop: "1px solid var(--border)",
                    }}
                  >
                    {/* Rank */}
                    <div
                      className="w-8 text-center font-bold text-sm flex-shrink-0"
                      style={{
                        color: medal
                          ? "var(--gold)"
                          : isCurrentUser
                            ? "var(--gold)"
                            : "var(--muted)",
                      }}
                    >
                      {medal || `#${entry.rank}`}
                    </div>

                    {/* Avatar + Name */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <Avatar
                        image={entry.image}
                        name={entry.name}
                        color={entry.avatarColor}
                        size={28}
                      />
                      <span
                        className="text-sm font-medium truncate"
                        style={{
                          color: isCurrentUser
                            ? "var(--gold)"
                            : "var(--foreground)",
                        }}
                      >
                        {entry.name}
                        {isCurrentUser && (
                          <span
                            className="text-[10px] ml-1.5 font-normal"
                            style={{ color: "var(--muted)" }}
                          >
                            (you)
                          </span>
                        )}
                      </span>
                      {!entry.hasPaid && (
                        <a
                          href="/payment"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105"
                          style={{
                            backgroundColor: "rgba(239, 68, 68, 0.12)",
                            color: "#ef4444",
                            border: "1px solid rgba(239, 68, 68, 0.25)",
                          }}
                        >
                          Unpaid
                        </a>
                      )}
                    </div>

                    {/* Points */}
                    <div className="text-right flex-shrink-0">
                      <span
                        className="text-sm font-bold"
                        style={{ color: "var(--foreground)" }}
                      >
                        {entry.totalPoints}
                      </span>
                      <span
                        className="text-[10px] ml-1"
                        style={{ color: "var(--muted)" }}
                      >
                        pts
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
