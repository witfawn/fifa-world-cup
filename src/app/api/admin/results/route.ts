import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getClient } from "@/lib/db";
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

  const client = getClient();
  const now = Math.floor(Date.now() / 1000);

  // Check if existing result exists (raw SQL)
  const existingResult = await client.execute({
    sql: "SELECT id, is_locked FROM match_results WHERE match_id = ? LIMIT 1",
    args: [matchId],
  });

  let locked = false;

  if (existingResult.rows.length > 0) {
    // Update existing
    const existingId = existingResult.rows[0].id;
    const existingLocked = existingResult.rows[0].is_locked;
    locked = isLocked ?? (existingLocked === 1);

    await client.execute({
      sql: "UPDATE match_results SET home_score = ?, away_score = ?, is_locked = ?, updated_at = ? WHERE id = ?",
      args: [homeScore, awayScore, locked ? 1 : 0, now, existingId],
    });
  } else {
    // Insert new
    const id = crypto.randomUUID();
    locked = isLocked ?? false;

    await client.execute({
      sql: "INSERT INTO match_results (id, match_id, home_score, away_score, is_locked, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [id, matchId, homeScore, awayScore, locked ? 1 : 0, now, now],
    });
  }

  // If locking, run scoring engine
  if (locked) {
    // Determine match type (group vs knockout) from schedule
    const scheduleMatch = getAllMatches().find((m) => m.id === matchId);
    const matchType = scheduleMatch ? getMatchType(scheduleMatch.group) : "group";

    // Get all predictions for this match (raw SQL)
    const predictionsResult = await client.execute({
      sql: "SELECT user_id, home_score, away_score FROM match_predictions WHERE match_id = ?",
      args: [matchId],
    });

    // Calculate and upsert points for each user
    for (const pred of predictionsResult.rows) {
      const predHome = pred.home_score;
      const predAway = pred.away_score;

      // Skip users with no prediction — they get 0 points
      if (predHome === null || predHome === undefined || predAway === null || predAway === undefined) continue;

      const points = calculatePoints(
        { homeScore: Number(predHome), awayScore: Number(predAway) },
        { homeScore, awayScore },
        matchType
      );

      // Upsert user points (raw SQL)
      const existingPoints = await client.execute({
        sql: "SELECT id FROM user_points WHERE user_id = ? AND match_id = ? LIMIT 1",
        args: [pred.user_id, matchId],
      });

      if (existingPoints.rows.length > 0) {
        await client.execute({
          sql: "UPDATE user_points SET points = ?, created_at = ? WHERE id = ?",
          args: [points, now, existingPoints.rows[0].id],
        });
      } else {
        const id = crypto.randomUUID();
        await client.execute({
          sql: "INSERT INTO user_points (id, user_id, match_id, points, created_at) VALUES (?, ?, ?, ?, ?)",
          args: [id, pred.user_id, matchId, points, now],
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
