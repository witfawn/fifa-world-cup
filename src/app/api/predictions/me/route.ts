import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { predictions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getServerSession(getAuthOptions());
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prediction = await getDb()
      .select()
      .from(predictions)
      .where(eq(predictions.userId, session.user.id))
      .limit(1);

    if (prediction.length === 0) {
      return NextResponse.json({ prediction: null });
    }

    return NextResponse.json({ prediction: prediction[0] });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch prediction" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(getAuthOptions());
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { winnerTeam, favoriteTeam } = body;

    if (!winnerTeam || !favoriteTeam) {
      return NextResponse.json(
        { error: "Both winnerTeam and favoriteTeam are required" },
        { status: 400 }
      );
    }

    await getDb()
      .update(predictions)
      .set({
        winnerTeam,
        favoriteTeam,
        updatedAt: new Date(),
      })
      .where(eq(predictions.userId, session.user.id));

    return NextResponse.json({ message: "Prediction updated" });
  } catch {
    return NextResponse.json(
      { error: "Failed to update prediction" },
      { status: 500 }
    );
  }
}
