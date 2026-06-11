import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb, getClient } from "@/lib/db";
import { matchResults, matchPredictions, userPoints } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { ADMIN_EMAILS } from "@/lib/config";
import { calculatePoints, getMatchType } from "@/lib/scoring";
import { getAllMatches } from "@/lib/schedule";

async function ensureTable() {
  const client = getClient();
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS match_results (
        id TEXT PRIMARY KEY,
        match_id INTEGER NOT NULL UNIQUE,
        home_score INTEGER NOT NULL,
        away_score INTEGER NOT NULL,
        is_locked INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);
  } catch {}
  try {
    await client.execute(
      "CREATE INDEX IF NOT EXISTS idx_match_results_match_id ON match_results(match_id)"
    );
  } catch {}
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS user_points (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        match_id INTEGER NOT NULL,
        points INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  } catch {}
  try {
    await client.execute(
      "CREATE UNIQUE INDEX IF NOT EXISTS points_user_match_idx ON user_points(user_id, match_id)"
    );
  } catch {}
}

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}

/**
 * POST /api/admin/results
 * Body: { matchId: number, homeScore: number, awayScore: number, isLocked?: boolean }
 *
 * Creates or updates the score for a match.
 * When isLocked is set to true, runs scoring engine for all predictions on that match.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await ensureTable();

  const body = await req.json();
  const { matchId, homeScore, awayScore, isLocked } = body;

  if (typeof matchId !== "number") {
    return NextResponse.json({ error: "Invalid matchId" }, { status: 400 });
  }
  if (typeof homeScore !== "number" || typeof awayScore !== "number") {
    return NextResponse.json({ error: "Invalid scores" }, { status: 400 });
  }

  const db = getDb();
  const now = new Date();

  // Upsert the match result
  const existing = await db
    .select()
    .from(matchResults)
    .where(eq(matchResults.matchId, matchId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(matchResults)
      .set({
        homeScore,
        awayScore,
        isLocked: isLocked ?? existing[0].isLocked,
        updatedAt: now,
      })
      .where(eq(matchResults.id, existing[0].id));
  } else {
    const id = crypto.randomUUID();
    await db.insert(matchResults).values({
      id,
      matchId,
      homeScore,
      awayScore,
      isLocked: isLocked ?? false,
      createdAt: now,
      updatedAt: now,
    });
  }

  // If locking, run scoring engine
  const locked = isLocked ?? (existing.length > 0 ? existing[0].isLocked : false);
  if (locked) {
    // Determine match type (group vs knockout) from schedule
    const scheduleMatch = getAllMatches().find((m) => m.id === matchId);
    const matchType = scheduleMatch ? getMatchType(scheduleMatch.group) : "group";

    // Get all predictions for this match
    const predictions = await db
      .select()
      .from(matchPredictions)
      .where(eq(matchPredictions.matchId, matchId));

    // Calculate and upsert points for each user
    for (const pred of predictions) {
      // Skip users with no prediction — they get 0 points
      if (pred.homeScore === null || pred.awayScore === null) continue;

      const points = calculatePoints(
        { homeScore: pred.homeScore, awayScore: pred.awayScore },
        { homeScore, awayScore },
        matchType
      );

      // Upsert user points
      const existingPoints = await db
        .select()
        .from(userPoints)
        .where(
          and(
            eq(userPoints.userId, pred.userId),
            eq(userPoints.matchId, matchId)
          )
        )
        .limit(1);

      if (existingPoints.length > 0) {
        await db
          .update(userPoints)
          .set({ points, createdAt: now })
          .where(eq(userPoints.id, existingPoints[0].id));
      } else {
        const id = crypto.randomUUID();
        await db.insert(userPoints).values({
          id,
          userId: pred.userId,
          matchId,
          points,
          createdAt: now,
        });
      }
    }
  }

  return NextResponse.json({
    success: true,
    matchId,
    homeScore,
    awayScore,
    isLocked: locked,
    scored: locked ? "scoring engine ran" : "not locked yet",
  });
}
