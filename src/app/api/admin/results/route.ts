import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ADMIN_EMAILS } from "@/lib/config";
import { calculatePoints, getMatchType } from "@/lib/scoring";
import { getAllMatches } from "@/lib/schedule";

export const dynamic = "force-dynamic";

const DB_URL = process.env.TURSO_DATABASE_URL!;
const AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN!;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rawQuery(sql: string, args: (string | number)[] = []): Promise<any[]> {
  const res = await fetch(`${DB_URL}/v2/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AUTH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        {
          type: "execute",
          stmt: { sql, args: args.map((v) => ({ type: v === null ? "null" : typeof v === "number" ? "integer" : "text", value: v })) },
        },
      ],
    }),
  });
  const data = await res.json();
  return data.results?.[0]?.response?.result?.rows || [];
}

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}

/**
 * POST /api/admin/results
 * Uses raw Turso HTTP API for both reads and writes (bypasses @libsql/client caching)
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Ensure table exists
  await rawQuery(`CREATE TABLE IF NOT EXISTS match_results (
    id TEXT PRIMARY KEY, match_id INTEGER NOT NULL UNIQUE,
    home_score INTEGER NOT NULL, away_score INTEGER NOT NULL,
    is_locked INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
  )`);

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
  const existingRows = await rawQuery(
    "SELECT id, is_locked FROM match_results WHERE match_id = ?1 LIMIT 1",
    [matchId]
  );

  let locked = false;

  if (existingRows.length > 0) {
    const existingId = existingRows[0][0]?.value;
    const existingLocked = existingRows[0][4]?.value;
    locked = isLocked ?? (existingLocked === 1);

    await rawQuery(
      "UPDATE match_results SET home_score = ?1, away_score = ?2, is_locked = ?3, updated_at = ?4 WHERE id = ?5",
      [homeScore, awayScore, locked ? 1 : 0, now, existingId]
    );
  } else {
    const id = crypto.randomUUID();
    locked = isLocked ?? false;
    await rawQuery(
      "INSERT INTO match_results (id, match_id, home_score, away_score, is_locked, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
      [id, matchId, homeScore, awayScore, locked ? 1 : 0, now, now]
    );
  }

  // If locking, run scoring engine
  if (locked) {
    const scheduleMatch = getAllMatches().find((m) => m.id === matchId);
    const matchType = scheduleMatch ? getMatchType(scheduleMatch.group) : "group";

    // Get all predictions for this match
    const predRows = await rawQuery(
      "SELECT user_id, home_score, away_score FROM match_predictions WHERE match_id = ?1",
      [matchId]
    );

    for (const pred of predRows) {
      const predHome = pred[1]?.value;
      const predAway = pred[2]?.value;
      if (predHome === null || predHome === undefined || predAway === null || predAway === undefined) continue;

      const points = calculatePoints(
        { homeScore: Number(predHome), awayScore: Number(predAway) },
        { homeScore, awayScore },
        matchType
      );

      const existingPoints = await rawQuery(
        "SELECT id FROM user_points WHERE user_id = ?1 AND match_id = ?2 LIMIT 1",
        [String(pred[0]?.value), matchId]
      );

      if (existingPoints.length > 0) {
        await rawQuery(
          "UPDATE user_points SET points = ?1, created_at = ?2 WHERE id = ?3",
          [points, now, existingPoints[0][0]?.value]
        );
      } else {
        const id = crypto.randomUUID();
        await rawQuery(
          "INSERT INTO user_points (id, user_id, match_id, points, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
          [id, String(pred[0]?.value), matchId, points, now]
        );
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
