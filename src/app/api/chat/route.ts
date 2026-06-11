import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getClient } from "@/lib/db";
import { ADMIN_EMAILS } from "@/lib/config";

async function ensureTable() {
  const client = getClient();
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_name TEXT,
        user_image TEXT,
        message TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  } catch {}
  try {
    await client.execute(
      "CREATE INDEX IF NOT EXISTS idx_chat_created_at ON chat_messages(created_at)"
    );
  } catch {}
}

// Only allow john@witfawn.com during development
function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}

/** GET /api/chat — returns last 100 messages */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await ensureTable();

  const client = getClient();
  const result = await client.execute(`
    SELECT id, user_id, user_name, user_image, message, created_at
    FROM chat_messages
    ORDER BY created_at DESC
    LIMIT 100
  `);

  // Reverse so oldest first (chat order)
  const messages = result.rows.reverse();

  return NextResponse.json(messages, {
    headers: {
      "Cache-Control":
        "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

/** POST /api/chat — send a message */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await ensureTable();

  const body = await req.json();
  const { message } = body;

  if (
    !message ||
    typeof message !== "string" ||
    message.trim().length === 0
  ) {
    return NextResponse.json(
      { error: "Message cannot be empty" },
      { status: 400 }
    );
  }

  if (message.length > 2000) {
    return NextResponse.json(
      { error: "Message too long (max 2000 characters)" },
      { status: 400 }
    );
  }

  const client = getClient();
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  await client.execute({
    sql: `INSERT INTO chat_messages (id, user_id, user_name, user_image, message, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      (session.user as { id: string }).id ?? session.user.email,
      session.user.name ?? null,
      session.user.image ?? null,
      message.trim(),
      now,
    ],
  });

  return NextResponse.json({
    success: true,
    id,
    user_name: session.user.name,
    user_image: session.user.image,
    message: message.trim(),
    created_at: now,
  });
}
