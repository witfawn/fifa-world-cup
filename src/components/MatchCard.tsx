"use client";

import { useCallback, useRef } from "react";
import { getTeamFlag, shortenTeamName } from "@/lib/teams";
import { isMatchLocked, formatKickoff, formatCountdown } from "@/lib/schedule";
import ScoreInput from "./ScoreInput";
import type { Match } from "@/lib/schedule";
import type { MatchPrediction as Prediction } from "@/lib/db/schema";

interface MatchCardProps {
  match: Match;
  prediction: Prediction | null;
  onSave: (matchId: number, homeScore: number | null, awayScore: number | null) => void;
}

export default function MatchCard({ match, prediction, onSave }: MatchCardProps) {
  const locked = isMatchLocked(match.date, match.time_pt);
  const hasPrediction =
    prediction?.homeScore !== null &&
    prediction?.homeScore !== undefined &&
    prediction?.awayScore !== null &&
    prediction?.awayScore !== undefined;

  // Debounce auto-save
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localHomeRef = useRef<number | null>(
    prediction?.homeScore ?? null
  );
  const localAwayRef = useRef<number | null>(
    prediction?.awayScore ?? null
  );

  // Sync from prop changes
  const homeScore = localHomeRef.current;
  const awayScore = localAwayRef.current;

  const debouncedSave = useCallback(
    (hScore: number | null, aScore: number | null) => {
      localHomeRef.current = hScore;
      localAwayRef.current = aScore;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onSave(match.id, hScore, aScore);
      }, 500);
    },
    [match.id, onSave]
  );

  const handleHomeChange = (val: number | null) => {
    debouncedSave(val, localAwayRef.current);
  };

  const handleAwayChange = (val: number | null) => {
    debouncedSave(localHomeRef.current, val);
  };

  const homeFlag = getTeamFlag(match.home);
  const awayFlag = getTeamFlag(match.away);

  const homeShort = shortenTeamName(match.home);
  const awayShort = shortenTeamName(match.away);
  const countdown = formatCountdown(match.date, match.time_pt);

  return (
    <div
      className="rounded-xl p-3 transition-all"
      style={{
        backgroundColor: "var(--surface)",
        border: hasPrediction
          ? "2px solid var(--gold)"
          : "2px solid var(--border)",
        opacity: locked ? 0.7 : 1,
      }}
    >
      {/* Header: Group + Matchday + Lock status */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
            style={{
              backgroundColor: "rgba(212, 168, 67, 0.15)",
              color: "var(--gold)",
            }}
          >
            Group {match.group}
          </span>
          <span className="text-[10px]" style={{ color: "var(--muted)" }}>
            MD{match.matchday}
          </span>
        </div>
        {locked ? (
          <div className="flex items-center gap-1">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--muted)"
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="text-[10px]" style={{ color: "var(--muted)" }}>
              Locked
            </span>
          </div>
        ) : (
          <span className="text-[10px]" style={{ color: "var(--success)" }}>
            {countdown}
          </span>
        )}
      </div>

      {/* Teams + Scores */}
      <div className="flex items-center justify-between gap-2">
        {/* Home team */}
        <div className="flex-1 text-right">
          <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            {homeFlag}
          </div>
          <div
            className="text-xs font-medium mt-0.5 truncate"
            style={{ color: "var(--foreground)" }}
          >
            {homeShort}
          </div>
        </div>

        {/* Score inputs */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <ScoreInput
            value={homeScore}
            onChange={handleHomeChange}
            disabled={locked}
          />
          <span
            className="text-sm font-bold"
            style={{ color: "var(--muted)" }}
          >
            —
          </span>
          <ScoreInput
            value={awayScore}
            onChange={handleAwayChange}
            disabled={locked}
          />
        </div>

        {/* Away team */}
        <div className="flex-1 text-left">
          <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            {awayFlag}
          </div>
          <div
            className="text-xs font-medium mt-0.5 truncate"
            style={{ color: "var(--foreground)" }}
          >
            {awayShort}
          </div>
        </div>
      </div>

      {/* Kickoff time + venue */}
      <div className="mt-2 text-center">
        <div className="text-[10px]" style={{ color: "var(--muted)" }}>
          {formatKickoff(match.date, match.time_pt)}
        </div>
        <div className="text-[9px] mt-0.5 truncate" style={{ color: "var(--muted)", opacity: 0.7 }}>
          {match.venue}
        </div>
      </div>
    </div>
  );
}
