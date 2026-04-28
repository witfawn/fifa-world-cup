import { LeaderboardTable } from "@/components/LeaderboardTable";
import { getClient } from "@/lib/db";

export const dynamic = "force-dynamic";

interface LeaderboardRow {
  id: string;
  userId: string;
  winnerTeam: string;
  favoriteTeam: string;
  createdAt: string;
  updatedAt: string;
  userName: string;
}

async function getLeaderboardData(): Promise<LeaderboardRow[]> {
  const client = getClient();
  const result = await client.execute(
    `SELECT p.id, p.user_id as userId, p.winner_team as winnerTeam, p.favorite_team as favoriteTeam, p.created_at as createdAt, p.updated_at as updatedAt, u.name as userName
     FROM predictions p
     LEFT JOIN users u ON p.user_id = u.id`
  );

  return result.rows.map((row) => ({
    id: String(row.id),
    userId: String(row.userId),
    winnerTeam: String(row.winnerTeam),
    favoriteTeam: String(row.favoriteTeam),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
    userName: row.userName != null ? String(row.userName) : "Anonymous",
  }));
}

export default async function LeaderboardPage() {
  const predictions = await getLeaderboardData();

  return (
    <div className="py-8 space-y-6">
      <h1 className="text-3xl font-bold text-center">Community Leaderboard</h1>
      <LeaderboardTable predictions={predictions} />
    </div>
  );
}
