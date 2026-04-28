"use client";

import { useSession } from "next-auth/react";

interface Prediction {
  id: string;
  userId: string;
  winnerTeam: string;
  favoriteTeam: string;
  createdAt: string;
  updatedAt: string;
  userName?: string;
}

interface LeaderboardTableProps {
  predictions: Prediction[];
}

function getSummaryRow(predictions: Prediction[]) {
  const winnerCounts: Record<string, number> = {};
  predictions.forEach((p) => {
    winnerCounts[p.winnerTeam] = (winnerCounts[p.winnerTeam] || 0) + 1;
  });

  const sorted = Object.entries(winnerCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return sorted;
}

export function LeaderboardTable({ predictions }: LeaderboardTableProps) {
  const { data: session } = useSession();
  const summary = getSummaryRow(predictions);

  return (
    <div className="space-y-6">
      {summary.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Most Popular Winner Picks</h3>
          <div className="flex flex-wrap gap-2">
            {summary.map(([team, count]) => (
              <span
                key={team}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {team} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                #
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Winner Pick
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Favorite Team
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Submitted
              </th>
            </tr>
          </thead>
          <tbody>
            {predictions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No predictions yet. Be the first to predict!
                </td>
              </tr>
            ) : (
              predictions.map((prediction, index) => (
                <tr
                  key={prediction.id}
                  className={`border-b ${
                    prediction.userId === session?.user?.id
                      ? "bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <td className="px-4 py-3 text-sm">{index + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {prediction.userName || "Anonymous"}
                  </td>
                  <td className="px-4 py-3 text-sm">{prediction.winnerTeam}</td>
                  <td className="px-4 py-3 text-sm">{prediction.favoriteTeam}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(prediction.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
