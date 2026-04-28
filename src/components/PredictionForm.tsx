"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TeamSelect } from "./TeamSelect";

interface PredictionFormProps {
  initialWinner?: string;
  initialFavorite?: string;
}

export function PredictionForm({
  initialWinner = "",
  initialFavorite = "",
}: PredictionFormProps) {
  const [winnerTeam, setWinnerTeam] = useState(initialWinner);
  const [favoriteTeam, setFavoriteTeam] = useState(initialFavorite);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!winnerTeam || !favoriteTeam) {
      setError("Please select both teams");
      return;
    }

    if (winnerTeam === favoriteTeam) {
      setError("Winner and favorite team must be different");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerTeam, favoriteTeam }),
      });

      if (!res.ok) {
        throw new Error("Failed to save prediction");
      }

      router.push("/leaderboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center">Make Your Prediction</h2>

      <TeamSelect
        id="winner-team"
        label="Who will win the World Cup?"
        value={winnerTeam}
        onChange={setWinnerTeam}
        excludeTeam={favoriteTeam}
      />

      <TeamSelect
        id="favorite-team"
        label="Your favorite team"
        value={favoriteTeam}
        onChange={setFavoriteTeam}
        excludeTeam={winnerTeam}
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Saving..." : "Submit Prediction"}
      </button>
    </form>
  );
}
