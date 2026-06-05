"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback, useRef } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import ProgressBar from "@/components/ProgressBar";
import GroupTabs from "@/components/GroupTabs";
import MatchCard from "@/components/MatchCard";
import {
  getAllMatches,
  getMatchesByGroup,
  getUpcomingMatches,
  getAllGroups,
  type Match,
} from "@/lib/schedule";
import type { MatchPrediction as Prediction } from "@/lib/db/schema";

const TOTAL_MATCHES = 72;
type ViewMode = "upcoming" | "group" | "all";

export default function PredictPage() {
  const { data: session, status } = useSession();

  const [predictions, setPredictions] = useState<Record<number, Prediction>>({});
  const [viewMode, setViewMode] = useState<ViewMode>("upcoming");
  const [selectedGroup, setSelectedGroup] = useState("A");
  const [loading, setLoading] = useState(true);

  // Ref to track latest predictions for optimistic updates
  const predictionsRef = useRef(predictions);
  predictionsRef.current = predictions;

  // All matches
  const allMatches = getAllMatches();
  const groups = getAllGroups();

  // Fetch existing predictions
  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/predictions")
        .then((res) => res.json())
        .then((data: Prediction[]) => {
          const map: Record<number, Prediction> = {};
          for (const p of data) {
            map[p.matchId] = p;
          }
          setPredictions(map);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status]);

  // Save handler with optimistic updates
  const userIdRef = useRef<string>("");
  if (session?.user) {
    userIdRef.current = (session.user as { id: string }).id || "";
  }

  const handleSave = useCallback(
    async (matchId: number, homeScore: number | null, awayScore: number | null) => {
      const userId = userIdRef.current;
      if (!userId) return;
      // Optimistic update
      const optimisticPrediction: Prediction = {
        id: predictionsRef.current[matchId]?.id || "",
        userId,
        matchId,
        homeScore,
        awayScore,
        createdAt: predictionsRef.current[matchId]?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      setPredictions((prev) => ({
        ...prev,
        [matchId]: optimisticPrediction,
      }));

      try {
        const res = await fetch("/api/predictions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId, homeScore, awayScore }),
        });

        if (res.ok) {
          const saved = await res.json();
          setPredictions((prev) => ({
            ...prev,
            [matchId]: saved,
          }));
        }
      } catch {
        // Revert on error — just refetch all
        fetch("/api/predictions")
          .then((res) => res.json())
          .then((data: Prediction[]) => {
            const map: Record<number, Prediction> = {};
            for (const p of data) map[p.matchId] = p;
            setPredictions(map);
          })
          .catch(() => {});
      }
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Get matches for current view
  const getDisplayMatches = (): Match[] => {
    switch (viewMode) {
      case "upcoming":
        return getUpcomingMatches().slice(0, 30); // limit to 30 for upcoming
      case "group":
        return getMatchesByGroup(selectedGroup);
      case "all":
        return allMatches;
      default:
        return allMatches;
    }
  };

  const displayMatches = getDisplayMatches();
  const pickedCount = Object.values(predictions).filter(
    (p) => p.homeScore !== null && p.awayScore !== null
  ).length;

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
            Loading predictions...
          </p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      <Header />

      {/* Progress bar */}
      <div className="max-w-4xl mx-auto px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>
            Games picked
          </span>
          <span className="text-xs font-bold" style={{ color: "var(--gold)" }}>
            {pickedCount}/{TOTAL_MATCHES}
          </span>
        </div>
        <ProgressBar picked={pickedCount} total={TOTAL_MATCHES} />
      </div>

      {/* View mode toggle */}
      <div className="max-w-4xl mx-auto px-4 pb-3">
        <div
          className="flex rounded-lg p-0.5 gap-0.5"
          style={{ backgroundColor: "var(--navy-light)" }}
        >
          {[
            { mode: "upcoming" as ViewMode, label: "📅 Upcoming", shortLabel: "📅" },
            { mode: "group" as ViewMode, label: "📋 By Group", shortLabel: "📋" },
            { mode: "all" as ViewMode, label: "🎯 All Games", shortLabel: "🎯" },
          ].map(({ mode, label, shortLabel }) => {
            const isActive = viewMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="flex-1 py-2 rounded-md text-xs font-bold transition-all"
                style={{
                  backgroundColor: isActive ? "var(--gold)" : "transparent",
                  color: isActive ? "var(--background)" : "var(--muted)",
                }}
              >
                <span className="sm:hidden">{shortLabel}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Group tabs (only in group view) */}
      {viewMode === "group" && (
        <div className="max-w-4xl mx-auto px-4 pb-3">
          <GroupTabs
            groups={groups}
            selected={selectedGroup}
            onSelect={setSelectedGroup}
          />
        </div>
      )}

      {/* Upcoming message */}
      {viewMode === "upcoming" && displayMatches.length === 0 && (
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <p className="text-4xl mb-3">⚽</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No upcoming matches. Check back soon!
          </p>
        </div>
      )}

      {/* Match list */}
      <div className="max-w-4xl mx-auto px-4 pb-24">
        <div className="space-y-3">
          {viewMode === "all" ? (
            // Group by matchday
            [1, 2, 3].map((md) => {
              const mdMatches = displayMatches.filter((m) => m.matchday === md);
              if (mdMatches.length === 0) return null;
              return (
                <div key={md}>
                  <h3
                    className="text-xs font-bold uppercase tracking-wider mb-2 mt-4"
                    style={{ color: "var(--muted)" }}
                  >
                    Matchday {md}
                  </h3>
                  <div className="space-y-3">
                    {mdMatches.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        prediction={predictions[match.id] || null}
                        onSave={handleSave}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            displayMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                prediction={predictions[match.id] || null}
                onSave={handleSave}
              />
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
