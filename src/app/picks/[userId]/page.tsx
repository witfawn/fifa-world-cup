"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Pick {
  matchId: number;
  date: string;
  timePt: string;
  group: string;
  home: string;
  away: string;
  predictedHome: number;
  predictedAway: number;
  predictedPkWinner: string | null;
  actualHome: number | null;
  actualAway: number | null;
  actualPkWinner: string | null;
  isLocked: boolean;
  points: number | null;
}

interface UserData {
  id: string;
  name: string;
  image: string | null;
}

// Team flag mapping
const FLAGS: Record<string, string> = {
  Algeria: "🇩🇿", Argentina: "🇦🇷", Australia: "🇦🇺", Austria: "🇦🇹",
  Belgium: "🇧🇪", "Bosnia-Herzegovina": "🇧🇦", Brazil: "🇧🇷", Canada: "🇨🇦",
  "Cape Verde": "🇨🇻", Colombia: "🇨🇴", "Congo DR": "🇨🇩", Croatia: "🇭🇷",
  Curaçao: "🇨🇼", Czechia: "🇨🇿", Ecuador: "🇪🇨", Egypt: "🇪🇬",
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", France: "🇫🇷", Germany: "🇩🇪", Ghana: "🇬🇭",
  Haiti: "🇭🇹", Iran: "🇮🇷", Iraq: "🇮🇶", "Ivory Coast": "🇨🇮",
  Japan: "🇯🇵", Jordan: "🇯🇴", Mexico: "🇲🇽", Morocco: "🇲🇦",
  Netherlands: "🇳🇱", "New Zealand": "🇳🇿", Norway: "🇳🇴", Panama: "🇵🇦",
  Paraguay: "🇵🇾", Portugal: "🇵🇹", Qatar: "🇶🇦", "Saudi Arabia": "🇸🇦",
  Scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", Senegal: "🇸🇳", "South Africa": "🇿🇦", "South Korea": "🇰🇷",
  Spain: "🇪🇸", Sweden: "🇸🇪", Switzerland: "🇨🇭", Tunisia: "🇹🇳",
  Türkiye: "🇹🇷", "United States": "🇺🇸", Uruguay: "🇺🇾", Uzbekistan: "🇺🇿",
};

function getFlag(team: string): string {
  return FLAGS[team] || "⚽";
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function UserPicksPage({
  params,
}: {
  params: { userId: string };
}) {
  const { userId } = params;
  const router = useRouter();
  const { status } = useSession();

  const [user, setUser] = useState<UserData | null>(null);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetch(`/api/users/${userId}/picks?t=${Date.now()}`)
        .then((r) => r.json())
        .then((data) => {
          setUser(data.user);
          setPicks(data.picks || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [userId, status, router]);

  // Unique dates for filter
  const uniqueDates = useMemo(() => {
    const dates = Array.from(new Set(picks.map((p) => p.date)));
    dates.sort();
    return dates;
  }, [picks]);

  // All unique teams from picks
  const uniqueTeams = useMemo(() => {
    const teams = new Set<string>();
    picks.forEach((p) => {
      teams.add(p.home);
      teams.add(p.away);
    });
    return Array.from(teams).sort();
  }, [picks]);

  // Filtered picks
  const filteredPicks = useMemo(() => {
    return picks.filter((p) => {
      if (dateFilter !== "all" && p.date !== dateFilter) return false;
      if (teamFilter !== "all" && p.home !== teamFilter && p.away !== teamFilter)
        return false;
      return true;
    });
  }, [picks, dateFilter, teamFilter]);

  // Total points
  const totalPoints = useMemo(() => {
    return picks.reduce((sum, p) => sum + (p.points || 0), 0);
  }, [picks]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full mx-auto mb-3" style={{ borderColor: "var(--gold)", borderTopColor: "transparent" }} />
          <p style={{ color: "var(--muted)" }}>Loading picks...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
        <p style={{ color: "var(--muted)" }}>User not found</p>
      </div>
    );
  }

  return (
    <main
      className="min-h-screen pb-24"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <button
          onClick={() => router.back()}
          className="text-sm mb-4 flex items-center gap-1"
          style={{ color: "var(--gold)" }}
        >
          ← Back
        </button>

        <div className="flex items-center gap-3 mb-4">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
              style={{ backgroundColor: "var(--navy-light)", color: "var(--gold)" }}
            >
              {user.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
              {user.name}
            </h1>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {picks.length} picks · {totalPoints} points
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="flex-1 rounded-xl px-3 py-2 text-sm"
            style={{
              backgroundColor: "var(--surface)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
            }}
          >
            <option value="all">All Dates</option>
            {uniqueDates.map((d) => (
              <option key={d} value={d}>
                {formatDate(d)}
              </option>
            ))}
          </select>

          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="flex-1 rounded-xl px-3 py-2 text-sm"
            style={{
              backgroundColor: "var(--surface)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
            }}
          >
            <option value="all">All Teams</option>
            {uniqueTeams.map((t) => (
              <option key={t} value={t}>
                {getFlag(t)} {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Picks list */}
      <div className="px-4 space-y-3">
        {filteredPicks.length === 0 ? (
          <div className="text-center py-8">
            <p style={{ color: "var(--muted)" }}>No picks match filters</p>
          </div>
        ) : (
          filteredPicks.map((pick) => (
            <div
              key={pick.matchId}
              className="rounded-xl p-4"
              style={{
                backgroundColor: pick.isLocked ? "rgba(212, 168, 67, 0.06)" : "var(--surface)",
                border: `1px solid ${pick.isLocked ? "rgba(212, 168, 67, 0.2)" : "var(--border)"}`,
              }}
            >
              {/* Date/time header */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                  {formatDate(pick.date)} · {pick.timePt}
                </span>
                <span className="text-[10px] font-mono" style={{ color: "var(--muted)" }}>
                  {pick.group}
                </span>
              </div>

              {/* Match and scores */}
              <div className="flex items-center justify-between">
                {/* Teams */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{getFlag(pick.home)}</span>
                    <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                      {pick.home}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{getFlag(pick.away)}</span>
                    <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                      {pick.away}
                    </span>
                  </div>
                </div>

                {/* Predicted score */}
                <div className="text-center px-3">
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--muted)" }}>
                    Pick
                  </div>
                  <div className="text-sm font-bold flex items-center justify-center gap-1" style={{ color: "var(--foreground)" }}>
                    {pick.predictedHome === pick.predictedAway && pick.predictedPkWinner && (
                      <span className="text-base">
                        {pick.predictedPkWinner === "home" ? getFlag(pick.home) : getFlag(pick.away)}
                      </span>
                    )}
                    {pick.predictedHome} — {pick.predictedAway}
                  </div>
                </div>

                {/* Actual score (if locked) */}
                {pick.isLocked && (
                  <div className="text-center px-3">
                    <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--muted)" }}>
                      Final
                    </div>
                    <div className="text-sm font-bold flex items-center justify-center gap-1" style={{ color: "var(--gold)" }}>
                      {pick.actualHome !== null && pick.actualAway !== null &&
                        pick.actualHome === pick.actualAway && pick.actualPkWinner && (
                          <span className="text-base">
                            {pick.actualPkWinner === "home" ? getFlag(pick.home) : getFlag(pick.away)}
                          </span>
                      )}
                      {pick.actualHome} — {pick.actualAway}
                    </div>
                  </div>
                )}

                {/* Points (if locked) */}
                {pick.isLocked && pick.points !== null && (
                  <div className="text-center pl-3">
                    <div
                      className="text-lg font-bold"
                      style={{ color: pick.points > 0 ? "var(--gold)" : "var(--muted)" }}
                    >
                      +{pick.points}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
