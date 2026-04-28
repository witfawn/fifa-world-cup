import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { predictions } from "@/lib/db/schema";
import { validatePrediction } from "@/lib/validation";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allPredictions = await getDb()
      .select({
        id: predictions.id,
        userId: predictions.userId,
        winnerTeam: predictions.winnerTeam,
        favoriteTeam: predictions.favoriteTeam,
        createdAt: predictions.createdAt,
        updatedAt: predictions.updatedAt,
      })
      .from(predictions);

    return NextResponse.json(allPredictions);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch predictions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(getAuthOptions());
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = validatePrediction(body);

    const existing = await getDb()
      .select()
      .from(predictions)
      .where(eq(predictions.userId, session.user.id))
      .limit(1);

    if (existing.length > 0) {
      await getDb()
        .update(predictions)
        .set({
          winnerTeam: data.winnerTeam,
          favoriteTeam: data.favoriteTeam,
          updatedAt: new Date(),
        })
        .where(eq(predictions.userId, session.user.id));

      return NextResponse.json({ message: "Prediction updated" });
    }

    await getDb().insert(predictions).values({
      userId: session.user.id,
      winnerTeam: data.winnerTeam,
      favoriteTeam: data.favoriteTeam,
    });

    return NextResponse.json({ message: "Prediction created" }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to save prediction" },
      { status: 500 }
    );
  }
}
