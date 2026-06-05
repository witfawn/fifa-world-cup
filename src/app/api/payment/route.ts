import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb, getClient } from "@/lib/db";
import { users, payments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

let migrated = false;

async function ensureTable() {
  if (migrated) return;
  const client = getClient();
  try {
    await client.execute(
      `CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount_cents INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        venmo_note TEXT,
        admin_notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`
    );
  } catch {
    // table might already exist
  }
  migrated = true;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await ensureTable();

  const db = getDb();

  // Get user id from email
  const userResult = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  if (userResult.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const userId = userResult[0].id;

  const result = await db
    .select()
    .from(payments)
    .where(eq(payments.userId, userId))
    .limit(1);

  if (result.length === 0) {
    return NextResponse.json({ payment: null });
  }

  return NextResponse.json({ payment: result[0] });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await ensureTable();

  const body = await req.json();
  const { amountCents, venmoNote } = body;

  if (!amountCents || typeof amountCents !== "number") {
    return NextResponse.json(
      { error: "amountCents is required and must be a number" },
      { status: 400 }
    );
  }

  const db = getDb();

  // Get user id from email
  const userResult = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  if (userResult.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const userId = userResult[0].id;

  // Check for existing payment
  const existing = await db
    .select()
    .from(payments)
    .where(eq(payments.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    const existingPayment = existing[0];

    if (existingPayment.status === "confirmed") {
      return NextResponse.json(
        { error: "Payment already confirmed" },
        { status: 400 }
      );
    }

    if (existingPayment.status === "pending") {
      // Update venmo note on existing pending payment
      const updated = await db
        .update(payments)
        .set({
          venmoNote: venmoNote ?? existingPayment.venmoNote,
          updatedAt: new Date(),
        })
        .where(eq(payments.userId, userId))
        .returning();

      return NextResponse.json({ payment: updated[0] });
    }
  }

  // Create new payment
  const inserted = await db
    .insert(payments)
    .values({
      userId,
      amountCents,
      status: "pending",
      venmoNote: venmoNote ?? null,
    })
    .returning();

  return NextResponse.json({ payment: inserted[0] });
}
