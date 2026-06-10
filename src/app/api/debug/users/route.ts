import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const all = await db.select().from(users);
  return NextResponse.json({
    count: all.length,
    users: all.map((u) => ({ id: u.id, email: u.email, name: u.name })),
  }, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
