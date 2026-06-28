import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ADMIN_EMAILS } from "@/lib/config";
import { calculatePoints, getMatchType } from "@/lib/scoring";
import { getAllMatches } from "@/lib/schedule";
import https from "https";

export const dynamic = "force-dynamic";

const DB_URL = (process.env.TURSO_DATABASE_URL || "").replace("libsql://", "https://");
const AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN!;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rawQuery(sql: string, args: { type: string; value: string | number | null }[] = []): Promise<any[]> {
  const body = JSON.stringify({
    requests: [
      {
        type: "execute",
        stmt: { sql, args: args.map((a) => ({ type: a.type, value: a.value === null ? null : String(a.value) })) },
      },
    ],
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await new Promise<any>((resolve, reject) => {
    const url = new URL(`${DB_URL}/v2/pipeline`);
    const req = https.request(
      {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: "POST",
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk: Buffer) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error(`Parse error: ${data.slice(0, 200)}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });

  return result.results?.[0]?.response?.result?.rows || [];
}

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}

/** POST /api/admin/results
 * Uses Node.js https module to bypass Vercel's fetch caching
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { matchId, homeScore, awayScore, pkWinner, isLocked } = body;

  if (typeof matchId !== "number") {
    return NextResponse.json({ error: "Invalid matchId" }, { status: 400 });
  }
  if (typeof homeScore !== "number" || typeof awayScore !== "number") {
    return NextResponse.json({ error: "Invalid scores" }, { status: 400 });
  }

  // Validate pkWinner: 'home' | 'away' | null
  const validPkWinner =
    pkWinner === "home" || pkWinner === "away" ? pkWinner : null;

  const now = Math.floor(Date.now() / 1000);

  // Ensure pk_winner column exists on match_results
  try {
    await rawQuery("ALTER TABLE match_results ADD COLUMN pk_winner TEXT");
  } catch {
    // column already exists
  }

  // Check existing
  const existingRows = await rawQuery(
    "SELECT id, is_locked FROM match_results WHERE match_id = ?1 LIMIT 1",
    [{ type: "text", value: String(matchId) }]
  );

  let locked = false;

  if (existingRows.length > 0) {
    const existingId = existingRows[0][0]?.value;
    const existingLocked = existingRows[0][1]?.value;
    locked = isLocked ?? (existingLocked === 1);

    await rawQuery(
      "UPDATE match_results SET home_score = ?1, away_score = ?2, pk_winner = ?3, is_locked = ?4, updated_at = ?5 WHERE id = ?6",
      [
        { type: "text", value: String(homeScore) },
        { type: "text", value: String(awayScore) },
        { type: "text", value: validPkWinner },
        { type: "text", value: locked ? "1" : "0" },
        { type: "text", value: String(now) },
        { type: "text", value: existingId },
      ]
    );
  } else {
    const id = crypto.randomUUID();
    locked = isLocked ?? false;
    await rawQuery(
      "INSERT INTO match_results (id, match_id, home_score, away_score, pk_winner, is_locked, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
      [
        { type: "text", value: id },
        { type: "text", value: String(matchId) },
        { type: "text", value: String(homeScore) },
        { type: "text", value: String(awayScore) },
        { type: "text", value: validPkWinner },
        { type: "text", value: locked ? "1" : "0" },
        { type: "text", value: String(now) },
        { type: "text", value: String(now) },
      ]
    );
  }

  // If locking, run scoring engine
  if (locked) {
    const scheduleMatch = getAllMatches().find((m) => m.id === matchId);
    const matchType = scheduleMatch ? getMatchType(scheduleMatch.group) : "group";

    const predRows = await rawQuery(
      "SELECT user_id, home_score, away_score, pk_winner FROM match_predictions WHERE match_id = ?1",
      [{ type: "text", value: String(matchId) }]
    );

    for (const pred of predRows) {
      const predHome = pred[1]?.value;
      const predAway = pred[2]?.value;
      const predPk = pred[3]?.value || null;
      if (predHome === null || predHome === undefined || predAway === null || predAway === undefined) continue;

      const points = calculatePoints(
        {
          homeScore: Number(predHome),
          awayScore: Number(predAway),
          pkWinner: predPk as "home" | "away" | null,
        },
        {
          homeScore,
          awayScore,
          pkWinner: validPkWinner,
        },
        matchType
      );

      const existingPoints = await rawQuery(
        "SELECT id FROM user_points WHERE user_id = ?1 AND match_id = ?2 LIMIT 1",
        [
          { type: "text", value: String(pred[0]?.value) },
          { type: "text", value: String(matchId) },
        ]
      );

      if (existingPoints.length > 0) {
        await rawQuery(
          "UPDATE user_points SET points = ?1, created_at = ?2 WHERE id = ?3",
          [
            { type: "text", value: String(points) },
            { type: "text", value: String(now) },
            { type: "text", value: existingPoints[0][0]?.value },
          ]
        );
      } else {
        const id = crypto.randomUUID();
        await rawQuery(
          "INSERT INTO user_points (id, user_id, match_id, points, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
          [
            { type: "text", value: id },
            { type: "text", value: String(pred[0]?.value) },
            { type: "text", value: String(matchId) },
            { type: "text", value: String(points) },
            { type: "text", value: String(now) },
          ]
        );
      }
    }
  }

  return NextResponse.json({
    success: true,
    matchId,
    homeScore,
    awayScore,
    pkWinner: validPkWinner,
    isLocked: locked,
    scored: locked ? "scoring engine ran" : "not locked yet",
  });
}
