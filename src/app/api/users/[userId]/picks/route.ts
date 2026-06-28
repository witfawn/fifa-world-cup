import { NextRequest, NextResponse } from "next/server";
import { getAllMatches } from "@/lib/schedule";
import https from "https";

export const dynamic = "force-dynamic";

const DB_URL = (process.env.TURSO_DATABASE_URL || "").replace("libsql://", "https://");
const AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN!;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rawQuery(sql: string, args: { type: string; value: string }[] = []): Promise<any[]> {
  const body = JSON.stringify({
    requests: [{ type: "execute", stmt: { sql, args } }],
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

/**
 * GET /api/users/[userId]/picks
 * Returns a user's predictions with match info, results, and points
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;

  // Get user info
  const userRows = await rawQuery(
    "SELECT id, name, image FROM users WHERE id = ?1",
    [{ type: "text", value: userId }]
  );

  if (userRows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const user = {
    id: userRows[0][0]?.value,
    name: userRows[0][1]?.value || "Unknown",
    image: userRows[0][2]?.value || null,
  };

  // Get user's predictions
  const predRows = await rawQuery(
    "SELECT match_id, home_score, away_score, pk_winner FROM match_predictions WHERE user_id = ?1",
    [{ type: "text", value: userId }]
  );

  // Get match results (locked games)
  const resultRows = await rawQuery(
    "SELECT match_id, home_score, away_score, pk_winner, is_locked FROM match_results WHERE is_locked = 1"
  );

  // Get user's points
  const pointsRows = await rawQuery(
    "SELECT match_id, points FROM user_points WHERE user_id = ?1",
    [{ type: "text", value: userId }]
  );

  // Build lookup maps
  const predictionsMap = new Map<number, { home: number; away: number; pkWinner: string | null }>();
  for (const row of predRows) {
    predictionsMap.set(Number(row[0]?.value), {
      home: Number(row[1]?.value),
      away: Number(row[2]?.value),
      pkWinner: row[3]?.value || null,
    });
  }

  const resultsMap = new Map<number, { home: number; away: number; pkWinner: string | null }>();
  for (const row of resultRows) {
    resultsMap.set(Number(row[0]?.value), {
      home: Number(row[1]?.value),
      away: Number(row[2]?.value),
      pkWinner: row[3]?.value || null,
    });
  }

  const pointsMap = new Map<number, number>();
  for (const row of pointsRows) {
    pointsMap.set(Number(row[0]?.value), Number(row[1]?.value));
  }

  // Merge with schedule — only show matches where user made a prediction
  const schedule = getAllMatches();
  const picks = schedule
    .filter((m) => predictionsMap.has(m.id))
    .map((m) => {
      const pred = predictionsMap.get(m.id)!;
      const result = resultsMap.get(m.id) || null;
      const points = pointsMap.get(m.id) ?? null;

      return {
        matchId: m.id,
        date: m.date,
        timePt: m.time_pt,
        group: m.group,
        home: m.home,
        away: m.away,
        predictedHome: pred.home,
        predictedAway: pred.away,
        predictedPkWinner: pred.pkWinner,
        actualHome: result?.home ?? null,
        actualAway: result?.away ?? null,
        actualPkWinner: result?.pkWinner ?? null,
        isLocked: result !== null,
        points,
      };
    })
    .sort((a, b) => {
      // Sort by date, then time
      const dateComp = a.date.localeCompare(b.date);
      if (dateComp !== 0) return dateComp;
      return a.timePt.localeCompare(b.timePt);
    });

  return NextResponse.json(
    { user, picks },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "CDN-Cache-Control": "no-store",
        "Vercel-CDN-Cache-Control": "no-store",
      },
    }
  );
}
