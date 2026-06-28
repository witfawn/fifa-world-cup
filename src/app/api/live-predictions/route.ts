import { NextResponse } from "next/server";
import https from "https";
import { getAllMatches, parseKickoff } from "@/lib/schedule";

export const dynamic = "force-dynamic";

/**
 * GET /api/live-predictions — return all predictions for currently live matches.
 * A match is "live" if kickoff has passed AND no locked result exists.
 */
export async function GET() {
  const dbUrl = (process.env.TURSO_DATABASE_URL || "").replace(
    "libsql://",
    "https://"
  );
  const authToken = process.env.TURSO_AUTH_TOKEN!;

  const now = new Date();

  // Find live matches from schedule
  const allMatches = getAllMatches();
  const liveMatches = allMatches.filter((m) => {
    const kickoff = parseKickoff(m.date, m.time_pt);
    return kickoff <= now;
  });

  if (liveMatches.length === 0) {
    return NextResponse.json([], {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
      },
    });
  }

  const liveMatchIds = liveMatches.map((m) => m.id);

  // Fetch all predictions for live matches + locked results
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await new Promise<any>((resolve, reject) => {
    const body = JSON.stringify({
      requests: [
        {
          type: "execute",
          stmt: {
            sql: `SELECT mp.match_id, mp.home_score, mp.away_score, mp.pk_winner, u.name
                  FROM match_predictions mp
                  JOIN users u ON mp.user_id = u.id
                  WHERE mp.match_id IN (${liveMatchIds.map(() => "?").join(",")})
                  ORDER BY mp.match_id, u.name`,
            args: liveMatchIds.map((id) => ({
              type: "integer",
              value: String(id),
            })),
          },
        },
        {
          type: "execute",
          stmt: {
            sql: `SELECT match_id FROM match_results WHERE is_locked = 1 AND match_id IN (${liveMatchIds.map(() => "?").join(",")})`,
            args: liveMatchIds.map((id) => ({
              type: "integer",
              value: String(id),
            })),
          },
        },
      ],
    });

    const url = new URL(`${dbUrl}/v2/pipeline`);
    const req = https.request(
      {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
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

  // Parse locked match IDs (second query result)
  const lockedRows =
    result.results?.[1]?.response?.result?.rows || [];
  const lockedMatchIds = new Set(
    lockedRows.map((row: { type: string; value: string }[]) =>
      Number(row[0]?.value)
    )
  );

  // Parse predictions (first query result)
  const predRows =
    result.results?.[0]?.response?.result?.rows || [];
  const predictionsByMatch: Record<
    number,
    { userName: string; homeScore: number | null; awayScore: number | null; pkWinner: string | null }[]
  > = {};

  for (const row of predRows) {
    const matchId = Number(row[0]?.value);
    const homeScore = row[1]?.value != null ? Number(row[1]?.value) : null;
    const awayScore = row[2]?.value != null ? Number(row[2]?.value) : null;
    const pkWinner = row[3]?.value || null;
    const userName = row[4]?.value || "Unknown";

    if (!predictionsByMatch[matchId]) {
      predictionsByMatch[matchId] = [];
    }
    predictionsByMatch[matchId].push({ userName, homeScore, awayScore, pkWinner });
  }

  // Build response: only live (not locked) matches with predictions
  const response = liveMatches
    .filter((m) => !lockedMatchIds.has(m.id))
    .map((m) => ({
      matchId: m.id,
      home: m.home,
      away: m.away,
      predictions: predictionsByMatch[m.id] || [],
    }))
    .filter((m) => m.predictions.length > 0); // Only show matches that have predictions

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store",
    },
  });
}
