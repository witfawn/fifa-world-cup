import { LeaderboardTable } from "@/components/LeaderboardTable";
import { getDb } from "@/lib/db";
import { predictions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function getLeaderboardData() {
  const data = await getDb()
    .select({
      id: predictions.id,
      userId: predictions.userId,
      winnerTeam: predictions.winnerTeam,
      favoriteTeam: predictions.favoriteTeam,
      createdAt: predictions.createdAt,
      updatedAt: predictions.updatedAt,
      userName: users.name,
    })
    .from(predictions)
    .leftJoin(users, eq(predictions.userId, users.id));

  return data.map((row) => ({
    ...row,
    userName: row.userName ?? "Anonymous",
    createdAt: row.createdAt instanceof Date
      ? row.createdAt.toISOString()
      : String(row.createdAt),
    updatedAt: row.updatedAt instanceof Date
      ? row.updatedAt.toISOString()
      : String(row.updatedAt),
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
