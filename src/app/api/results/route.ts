import { NextResponse } from "next/server";
import { getClient } from "@/lib/db";

export const dynamic = "force-dynamic";

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
}

/** GET /api/results — return all match results (public, raw SQL) */
export async function GET() {
  await ensureTable();
  const client = getClient();

  const result = await client.execute("SELECT * FROM match_results");

  // Map snake_case to camelCase
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
      "X-Debug-Time": new Date().toISOString(),
    },
  });
}
