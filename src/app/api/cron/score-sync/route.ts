import { NextRequest, NextResponse } from "next/server";
import { calculatePoints, getMatchType } from "@/lib/scoring";
import { getAllMatches } from "@/lib/schedule";
import https from "https";

export const dynamic = "force-dynamic";

const DB_URL = (process.env.TURSO_DATABASE_URL || "").replace("libsql://", "https:");
const AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN!;
const FD_API_KEY = process.env.FOOTBALL_DATA_API_KEY || "";

// Reconcile football-data.org team names → our schedule.json names
// football-data.org uses FIFA's official naming conventions
const TEAM_NAME_MAP: Record<string, string> = {
  "Korea Republic": "South Korea",
  "DR Congo": "Congo DR",
  "Côte d'Ivoire": "Ivory Coast",
  "Cabo Verde": "Cape Verde",
  "Bosnia and Herzegovina": "Bosnia-Herzegovina",
  "Türkiye": "Türkiye", // explicit — some APIs use "Turkey"
};

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

/** Fetch recent matches from football-data.org */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchRecentMatches(): Promise<{ data: any; rateLimit: { available: string | null; reset: string | null } }> {
  const now = new Date();
  // Use Pacific Time (PT) for date calculations since the schedule is in PT.
  // UTC rolls over at 5 PM PT, which would skip same-day PT matches.
  const ptToday = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  // Look back 1 day so any downtime doesn't permanently miss finished matches
  const dateFrom = new Date(ptToday.getTime() - 1 * 86400000).toISOString().slice(0, 10);
  // dateTo is exclusive — add 2 days to cover today + tomorrow
  const dateTo = new Date(ptToday.getTime() + 2 * 86400000).toISOString().slice(0, 10);

  const url = `https://api.football-data.org/v4/competitions/2000/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      headers: { "X-Auth-Token": FD_API_KEY },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Football-data.org API error: ${res.status} ${await res.text()}`);
    }

    const rateLimit = {
      available: res.headers.get("x-requests-available"),
      reset: res.headers.get("x-request-counter-reset"),
    };
    const data = await res.json();
    return { data, rateLimit };
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

/** Map API match to our internal match ID using team names */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToInternalMatch(apiMatch: any): number | null {
  const schedule = getAllMatches();
  const homeName = TEAM_NAME_MAP[apiMatch.homeTeam.name] || apiMatch.homeTeam.name;
  const awayName = TEAM_NAME_MAP[apiMatch.awayTeam.name] || apiMatch.awayTeam.name;

  const match = schedule.find(
    (m) => m.home === homeName && m.away === awayName
  );

  return match ? match.id : null;
}

/** Ensure match_results row exists, return whether it was already locked */
async function upsertScore(matchId: number, homeScore: number, awayScore: number, locked: boolean): Promise<{ alreadyLocked: boolean; isNew: boolean }> {
  const now = Math.floor(Date.now() / 1000);

  const existing = await rawQuery(
    "SELECT id, is_locked FROM match_results WHERE match_id = ?1 LIMIT 1",
    [{ type: "integer", value: matchId }]
  );

  if (existing.length > 0) {
    const id = existing[0][0]?.value;
    const lockedVal = existing[0][1]?.value;
    const alreadyLocked = lockedVal === 1 || lockedVal === true || lockedVal === "1";

    await rawQuery(
      "UPDATE match_results SET home_score = ?1, away_score = ?2, is_locked = ?3, updated_at = ?4 WHERE id = ?5",
      [
        { type: "integer", value: homeScore },
        { type: "integer", value: awayScore },
        { type: "integer", value: locked ? 1 : 0 },
        { type: "integer", value: now },
        { type: "text", value: id },
      ]
    );

    return { alreadyLocked, isNew: false };
  } else {
    const id = crypto.randomUUID();
    await rawQuery(
      "INSERT INTO match_results (id, match_id, home_score, away_score, is_locked, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
      [
        { type: "text", value: id },
        { type: "integer", value: matchId },
        { type: "integer", value: homeScore },
        { type: "integer", value: awayScore },
        { type: "integer", value: locked ? 1 : 0 },
        { type: "integer", value: now },
        { type: "integer", value: now },
      ]
    );

    return { alreadyLocked: false, isNew: true };
  }
}

/** Run scoring engine for a locked match */
async function scoreMatch(matchId: number, homeScore: number, awayScore: number) {
  const schedule = getAllMatches().find((m) => m.id === matchId);
  const matchType = schedule ? getMatchType(schedule.group) : "group";

  const predRows = await rawQuery(
    "SELECT user_id, home_score, away_score FROM match_predictions WHERE match_id = ?1",
    [{ type: "integer", value: matchId }]
  );

  let scored = 0;
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
      [
        { type: "text", value: String(pred[0]?.value) },
        { type: "integer", value: matchId },
      ]
    );

    const now = Math.floor(Date.now() / 1000);

    if (existingPoints.length > 0) {
      await rawQuery(
        "UPDATE user_points SET points = ?1, created_at = ?2 WHERE id = ?3",
        [
          { type: "integer", value: points },
          { type: "integer", value: now },
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
          { type: "integer", value: matchId },
          { type: "integer", value: points },
          { type: "integer", value: now },
        ]
      );
    }
    scored++;
  }

  return scored;
}

/**
 * GET /api/cron/score-sync
 * Called by Vercel cron every 5 minutes.
 * Fetches finished matches from football-data.org and auto-scores them.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  try {
    const { data, rateLimit } = await fetchRecentMatches();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const matches: any[] = data.matches || [];

    const results = [];

    for (const apiMatch of matches) {
      if (apiMatch.status !== "FINISHED" && apiMatch.status !== "AWARDED") continue;

      const internalId = mapToInternalMatch(apiMatch);
      if (internalId === null) {
        results.push({
          api: `${apiMatch.homeTeam.name} vs ${apiMatch.awayTeam.name}`,
          status: "no_match_found",
        });
        continue;
      }

      const homeScore = apiMatch.score?.fullTime?.home;
      const awayScore = apiMatch.score?.fullTime?.away;
      if (homeScore === null || awayScore === null) continue;

      const { alreadyLocked, isNew } = await upsertScore(internalId, homeScore, awayScore, true);

      let scored = 0;
      if (!alreadyLocked) {
        scored = await scoreMatch(internalId, homeScore, awayScore);
      }

      results.push({
        match: `${apiMatch.homeTeam.name} vs ${apiMatch.awayTeam.name}`,
        score: `${homeScore}-${awayScore}`,
        internalId,
        isNew,
        alreadyLocked,
        scored,
      });
    }

    // Log rate limit info for monitoring
    console.log(`[score-sync] Rate limit: ${rateLimit.available} requests remaining, resets in ${rateLimit.reset}s`);
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      totalMatches: matches.length,
      finishedProcessed: results.length,
      results,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Score sync error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
