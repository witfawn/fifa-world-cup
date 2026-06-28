import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb, getClient } from "@/lib/db";
import { matchPredictions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { isMatchLocked, getAllMatches } from "@/lib/schedule";

let migrated = false;

async function ensureTable() {
  if (migrated) return;
  const client = getClient();
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS match_predictions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        match_id INTEGER NOT NULL,
        home_score INTEGER,
        away_score INTEGER,
        pk_winner TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  } catch {
    // table might already exist
  }
  // Add pk_winner column if missing (migrations for existing DBs)
  try {
    await client.execute(`ALTER TABLE match_predictions ADD COLUMN pk_winner TEXT`);
  } catch {
    // column already exists
  }
  try {
    await client.execute(
      "CREATE UNIQUE INDEX IF NOT EXISTS user_match_idx ON match_predictions(user_id, match_id)"
    );
  } catch {
    // index might already exist
  }
  migrated = true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getUserId(session: any): string | null {
  return session?.user?.id ?? null;
}

/** GET /api/predictions — fetch all predictions for the authenticated user */
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await ensureTable();

  const db = getDb();
  const result = await db
    .select()
    .from(matchPredictions)
    .where(eq(matchPredictions.userId, userId));

  return NextResponse.json(result);
}

/** POST /api/predictions — upsert a single prediction (auto-save) */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await ensureTable();

  const body = await req.json();
  const { matchId, homeScore, awayScore, pkWinner } = body;

  if (typeof matchId !== "number") {
    return NextResponse.json({ error: "Invalid matchId" }, { status: 400 });
  }

  // Validate scores are non-negative integers or null
  const hScore =
    homeScore !== null && homeScore !== undefined ? Number(homeScore) : null;
  const aScore =
    awayScore !== null && awayScore !== undefined ? Number(awayScore) : null;

  if (hScore !== null && (typeof hScore !== "number" || hScore < 0 || !Number.isInteger(hScore))) {
    return NextResponse.json({ error: "Invalid homeScore" }, { status: 400 });
  }
  if (aScore !== null && (typeof aScore !== "number" || aScore < 0 || !Number.isInteger(aScore))) {
    return NextResponse.json({ error: "Invalid awayScore" }, { status: 400 });
  }

  // Validate pkWinner: 'home' | 'away' | null
  const validPkWinner =
    pkWinner === "home" || pkWinner === "away" ? pkWinner : null;

  // Lock check: reject predictions for matches that are within 5 min of kickoff
  const match = getAllMatches().find((m) => m.id === matchId);
  if (match && isMatchLocked(match.date, match.time_pt)) {
    return NextResponse.json({ error: "Match is locked — kickoff is within 5 minutes" }, { status: 409 });
  }

  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  // Check if existing prediction exists
  const existing = await db
    .select()
    .from(matchPredictions)
    .where(
      and(
        eq(matchPredictions.userId, userId),
        eq(matchPredictions.matchId, matchId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update
    await db
      .update(matchPredictions)
      .set({
        homeScore: hScore,
        awayScore: aScore,
        pkWinner: validPkWinner,
        updatedAt: new Date(now * 1000),
      })
      .where(eq(matchPredictions.id, existing[0].id));

    return NextResponse.json({
      ...existing[0],
      homeScore: hScore,
      awayScore: aScore,
      pkWinner: validPkWinner,
      updatedAt: new Date(now * 1000),
    });
  } else {
    // Insert
    const id = crypto.randomUUID();
    await db.insert(matchPredictions).values({
      id,
      userId,
      matchId,
      homeScore: hScore,
      awayScore: aScore,
      pkWinner: validPkWinner,
      createdAt: new Date(now * 1000),
      updatedAt: new Date(now * 1000),
    });

    return NextResponse.json({
      id,
      userId,
      matchId,
      homeScore: hScore,
      awayScore: aScore,
      pkWinner: validPkWinner,
      createdAt: new Date(now * 1000),
      updatedAt: new Date(now * 1000),
    });
  }
}
