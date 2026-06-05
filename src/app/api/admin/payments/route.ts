import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb, getClient } from "@/lib/db";
import { users, payments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ADMIN_EMAILS } from "@/lib/config";

let migrated = false;

async function ensureTable() {
  if (migrated) return;
  const client = getClient();
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        amount_cents INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        venmo_note TEXT,
        admin_notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  } catch {
    // table might already exist
  }
  migrated = true;
}

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}

/** GET /api/admin/payments — return all users with their payment status */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await ensureTable();

  const db = getDb();

  // Query all users with LEFT JOIN on payments
  const rows = await db
    .select({
      userId: users.id,
      userEmail: users.email,
      userName: users.name,
      paymentId: payments.id,
      paymentStatus: payments.status,
      paymentAmountCents: payments.amountCents,
      paymentVenmoNote: payments.venmoNote,
      paymentCreatedAt: payments.createdAt,
    })
    .from(users)
    .leftJoin(payments, eq(users.id, payments.userId));

  const result = rows.map((row) => ({
    user: {
      id: row.userId,
      email: row.userEmail,
      name: row.userName,
    },
    payment: row.paymentId
      ? {
          id: row.paymentId,
          status: row.paymentStatus,
          amountCents: row.paymentAmountCents,
          venmoNote: row.paymentVenmoNote,
          createdAt: row.paymentCreatedAt,
        }
      : null,
  }));

  return NextResponse.json(result);
}

/** POST /api/admin/payments — update a payment status (confirm/reject) */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await ensureTable();

  const body = await req.json();
  const { paymentId, status, adminNotes } = body;

  if (!paymentId || typeof paymentId !== "string") {
    return NextResponse.json({ error: "Invalid paymentId" }, { status: 400 });
  }

  if (status !== "confirmed" && status !== "rejected") {
    return NextResponse.json(
      { error: "Status must be 'confirmed' or 'rejected'" },
      { status: 400 }
    );
  }

  const db = getDb();

  // Check that the payment exists
  const existing = await db
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  const now = new Date();

  await db
    .update(payments)
    .set({
      status,
      adminNotes: adminNotes ?? existing[0].adminNotes,
      updatedAt: now,
    })
    .where(eq(payments.id, paymentId));

  const updated = await db
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1);

  return NextResponse.json(updated[0]);
}
