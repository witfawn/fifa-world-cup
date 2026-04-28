import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { predictions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const data = await getDb()
      .select({
        id: predictions.id,
        userId: predictions.userId,
        winnerTeam: predictions.winnerTeam,
        favoriteTeam: predictions.favoriteTeam,
        createdAt: predictions.createdAt,
        updatedAt: predictions.updatedAt,
        userName: users.name,
      })
      .from(predictions)
      .leftJoin(users, eq(predictions.userId, users.id));

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
