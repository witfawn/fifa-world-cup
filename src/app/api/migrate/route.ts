import { NextResponse } from "next/server";
import { getDb, getClient } from "@/lib/db";

export async function POST() {
  try {
    const client = getClient();

    // Add avatar_color column if it doesn't exist
    try {
      await client.execute("ALTER TABLE users ADD COLUMN avatar_color TEXT");
    } catch {
      // Column may already exist
    }

    // Add profile_complete column if it doesn't exist
    try {
      await client.execute(
        "ALTER TABLE users ADD COLUMN profile_complete INTEGER NOT NULL DEFAULT 0"
      );
    } catch {
      // Column may already exist
    }

    // Verify
    const result = await client.execute("PRAGMA table_info(users)");
    const columns = result.rows.map((r) => r.name);

    return NextResponse.json({
      success: true,
      columns,
    });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
