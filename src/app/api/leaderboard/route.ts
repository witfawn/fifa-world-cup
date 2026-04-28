import { NextResponse } from "next/server";
import { getClient } from "@/lib/db";

export async function GET() {
  try {
    const client = getClient();
    const result = await client.execute(
      `SELECT p.id, p.user_id as userId, p.winner_team as winnerTeam, p.favorite_team as favoriteTeam, p.created_at as createdAt, p.updated_at as updatedAt, u.name as userName
       FROM predictions p
       LEFT JOIN users u ON p.user_id = u.id`
    );

    const data = result.rows.map((row) => ({
      id: String(row.id),
      userId: String(row.userId),
      winnerTeam: String(row.winnerTeam),
      favoriteTeam: String(row.favoriteTeam),
      createdAt: String(row.createdAt),
      updatedAt: String(row.updatedAt),
      userName: row.userName != null ? String(row.userName) : "Anonymous",
    }));

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
