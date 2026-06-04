import { NextResponse } from "next/server";
import { getDb, getClient } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    // Ensure columns exist first
    const client = getClient();
    try {
      await client.execute("ALTER TABLE users ADD COLUMN avatar_color TEXT");
    } catch { /* exists */ }
    try {
      await client.execute("ALTER TABLE users ADD COLUMN profile_complete INTEGER NOT NULL DEFAULT 0");
    } catch { /* exists */ }

    const db = getDb();
    const result = await db
      .delete(users)
      .where(eq(users.email, "john@witfawn.com"))
      .returning();

    return NextResponse.json({
      success: true,
      deleted: result.length,
      email: "john@witfawn.com",
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
