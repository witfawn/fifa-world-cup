import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ADMIN_EMAILS } from "@/lib/config";
import { calculatePoints, getMatchType } from "@/lib/scoring";
import { getAllMatches } from "@/lib/schedule";

export const dynamic = "force-dynamic";

function getClient() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require("@libsql/client") as typeof import("@libsql/client");
  return createClient({
    url: (process.env.TURSO_DATABASE_URL || "").replace("libsql://", "https://"),
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}

/**
 * POST /api/admin/results
 * Uses @libsql/client with https:// URL to bypass edge caching
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Ensure table exists
  const client = getClient();
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS match_results (
        id TEXT PRIMARY KEY, match_id INTEGER NOT NULL UNIQUE,
        home_score INTEGER NOT NULL, away_score INTEGER NOT NULL,
        is_locked INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
      )
    `);
  } catch {}

  const body = await req.json();
  const { matchId, homeScore, awayScore, isLocked } = body;

  if (typeof matchId !== "number") {
    return NextResponse.json({ error: "Invalid matchId" }, { status: 400 });
  }
  if (typeof homeScore !== "number" || typeof awayScore !== "number") {
    return NextResponse.json({ error: "Invalid scores" }, { status: 400 });
  }

  const now = Math.floor(Date.now() / 1000);

  // Check existing
  const existingResult = await client.execute({
    sql: "SELECT id, is_locked FROM match_results WHERE match_id = ?1 LIMIT 1",
    args: [matchId],
  });

  let locked = false;

  if (existingResult.rows.length > 0) {
    const existingId = existingResult.rows[0].id as string;
    const existingLocked = existingResult.rows[0].is_locked as number;
    locked = isLocked ?? (existingLocked === 1);

    await client.execute({
      sql: "UPDATE match_results SET home_score = ?1, away_score = ?2, is_locked = ?3, updated_at = ?4 WHERE id = ?5",
      args: [homeScore, awayScore, locked ? 1 : 0, now, existingId],
    });
  } else {
    const id = crypto.randomUUID();
    locked = isLocked ?? false;
    await client.execute({
      sql: "INSERT INTO match_results (id, match_id, home_score, away_score, is_locked, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
      args: [id, matchId, homeScore, awayScore, locked ? 1 : 0, now, now],
    });
  }

  // If locking, run scoring engine
  if (locked) {
    const scheduleMatch = getAllMatches().find((m) => m.id === matchId);
    const matchType = scheduleMatch ? getMatchType(scheduleMatch.group) : "group";

    const predictionsResult = await client.execute({
      sql: "SELECT user_id, home_score, away_score FROM match_predictions WHERE match_id = ?1",
      args: [matchId],
    });

    for (const pred of predictionsResult.rows) {
      const predHome = pred.home_score as number | null;
      const predAway = pred.away_score as number | null;
      if (predHome === null || predHome === undefined || predAway === null || predAway === undefined) continue;

      const points = calculatePoints(
        { homeScore: Number(predHome), awayScore: Number(predAway) },
        { homeScore, awayScore },
        matchType
      );

      const existingPoints = await client.execute({
        sql: "SELECT id FROM user_points WHERE user_id = ?1 AND match_id = ?2 LIMIT 1",
        args: [String(pred.user_id), matchId],
      });

      if (existingPoints.rows.length > 0) {
        await client.execute({
          sql: "UPDATE user_points SET points = ?1, created_at = ?2 WHERE id = ?3",
          args: [points, now, existingPoints.rows[0].id as string],
        });
      } else {
        const id = crypto.randomUUID();
        await client.execute({
          sql: "INSERT INTO user_points (id, user_id, match_id, points, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
          args: [id, String(pred.user_id), matchId, points, now],
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
