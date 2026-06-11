import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

export const dynamic = "force-dynamic";

/** GET /api/results — return all match results (public, raw SQL, fresh client) */
export async function GET() {
  // Create a FRESH client per request to avoid stale connection pooling
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
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
  } catch {}

  const result = await client.execute("SELECT * FROM match_results");

  const results = result.rows.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: r.id,
      matchId: r.match_id,
      homeScore: r.home_score,
      awayScore: r.away_score,
      isLocked: r.is_locked === 1,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
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
