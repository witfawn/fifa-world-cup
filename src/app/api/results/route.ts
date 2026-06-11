import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/results — return all match results
 * Uses @libsql/client with https:// URL to bypass edge caching
 */
export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require("@libsql/client") as typeof import("@libsql/client");

  const client = createClient({
    url: (process.env.TURSO_DATABASE_URL || "").replace("libsql://", "https://"),
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  // Ensure table exists
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
  } catch {
    // Table already exists
  }

  // Query results
  const result = await client.execute("SELECT * FROM match_results");

  const results = result.rows.map((row) => ({
    id: row.id,
    matchId: Number(row.match_id),
    homeScore: Number(row.home_score),
    awayScore: Number(row.away_score),
    isLocked: Number(row.is_locked) === 1,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  }));

  return NextResponse.json(results, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store",
    },
  });
}
