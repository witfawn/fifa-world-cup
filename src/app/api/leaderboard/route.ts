import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb, getClient } from "@/lib/db";
import { users, matchPredictions, payments, userPoints } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
import { eq, count, and } from "drizzle-orm";

let migrated = false;

async function ensureTable() {
  if (migrated) return;
  const client = getClient();
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS match_predictions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        match_id INTEGER NOT NULL,
        home_score INTEGER,
        away_score INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  } catch {
    // table might already exist
  }
  try {
    await client.execute(
      "CREATE UNIQUE INDEX IF NOT EXISTS user_match_idx ON match_predictions(user_id, match_id)"
    );
  } catch {
    // index might already exist
  }
  migrated = true;
}

export async function GET() {
  await ensureTable();

  const db = getDb();

  // Get all users with their prediction counts and payment status
  const usersWithCounts = await db
    .select({
      id: users.id,
      name: users.name,
      image: users.image,
      avatarColor: users.avatarColor,
      predictionCount: count(matchPredictions.id),
      hasPaid: payments.status,
    })
    .from(users)
    .leftJoin(
      matchPredictions,
      eq(users.id, matchPredictions.userId)
    )
    .leftJoin(
      payments,
      and(eq(users.id, payments.userId), eq(payments.status, "confirmed"))
    )
    .groupBy(users.id);

  // For each user, fetch their predictions and calculate points from user_points table
  const allPredictions = await db.select().from(matchPredictions);
  const allPoints = await db.select().from(userPoints);

  // Group predictions by userId
  const predictionsByUser = new Map<
    string,
    typeof allPredictions
  >();
  for (const p of allPredictions) {
    const list = predictionsByUser.get(p.userId) || [];
    list.push(p);
    predictionsByUser.set(p.userId, list);
  }

  // Group points by userId
  const pointsByUser = new Map<string, number>();
  for (const up of allPoints) {
    pointsByUser.set(up.userId, (pointsByUser.get(up.userId) || 0) + up.points);
  }

  // Build leaderboard entries
  const entries = usersWithCounts.map((u) => {
    const preds = predictionsByUser.get(u.id) || [];
    const totalPoints = pointsByUser.get(u.id) || 0;
    let picksWithScores = 0;

    for (const p of preds) {
      if (p.homeScore !== null && p.awayScore !== null) {
        picksWithScores++;
      }
    }

    return {
      id: u.id,
      name: u.name,
      image: u.image,
      avatarColor: u.avatarColor,
      predictionCount: u.predictionCount,
      totalPoints,
      picksWithScores,
      hasPaid: u.hasPaid === "confirmed",
    };
  });

  // Sort: by points desc, then by prediction count desc, then name asc
  entries.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.predictionCount !== a.predictionCount)
      return b.predictionCount - a.predictionCount;
    return a.name.localeCompare(b.name);
  });

  // Add rank
  const ranked = entries.map((e, i) => ({
    ...e,
    rank: i + 1,
  }));

  // Get current user's info for the session
  const session = await getServerSession(authOptions);
  const currentUserId = (session?.user as { id: string })?.id || null;

  // Current user performance
  const currentUserEntry = currentUserId
    ? ranked.find((r) => r.id === currentUserId)
    : null;

  // Avg per game
  const avgPerGame =
    currentUserEntry && currentUserEntry.predictionCount > 0
      ? +(currentUserEntry.totalPoints / currentUserEntry.predictionCount).toFixed(
          1
        )
      : 0;

  return NextResponse.json(
    {
      leaderboard: ranked,
      totalPlayers: ranked.length,
      debug: {
        queryUserCount: ranked.length,
        userNames: ranked.map((e) => e.name),
        timestamp: new Date().toISOString(),
      },
      currentUser: currentUserId
        ? {
            rank: currentUserEntry?.rank ?? ranked.length + 1,
            points: currentUserEntry?.totalPoints ?? 0,
            picks: currentUserEntry?.predictionCount ?? 0,
            avgPerGame,
          }
        : null,
    },
    {
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}
