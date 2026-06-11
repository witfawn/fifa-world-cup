import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/results — return all match results
 * Uses raw Turso HTTP API (bypasses @libsql/client caching)
 */
export async function GET() {
  const dbUrl = process.env.TURSO_DATABASE_URL!;
  const authToken = process.env.TURSO_AUTH_TOKEN!;

  // Ensure table exists
  await fetch(`${dbUrl}/v2/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        {
          type: "execute",
          stmt: {
            sql: `CREATE TABLE IF NOT EXISTS match_results (
              id TEXT PRIMARY KEY,
              match_id INTEGER NOT NULL UNIQUE,
              home_score INTEGER NOT NULL,
              away_score INTEGER NOT NULL,
              is_locked INTEGER NOT NULL DEFAULT 0,
              created_at INTEGER NOT NULL,
              updated_at INTEGER NOT NULL
            )`,
          },
        },
      ],
    }),
  });

  // Query results
  const res = await fetch(`${dbUrl}/v2/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        {
          type: "execute",
          stmt: { sql: "SELECT * FROM match_results" },
        },
      ],
    }),
  });

  const data = await res.json();
  const rows = data.results?.[0]?.response?.result?.rows || [];

  // Map Turso pipeline format to camelCase
  const results = rows.map((row: { type: string; value: string }[]) => {
    return {
      id: row[0]?.value,
      matchId: Number(row[1]?.value),
      homeScore: Number(row[2]?.value),
      awayScore: Number(row[3]?.value),
      isLocked: Number(row[4]?.value) === 1,
      createdAt: Number(row[5]?.value),
      updatedAt: Number(row[6]?.value),
    };
  });

  return NextResponse.json(results, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store",
    },
  });
}
