import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const db = getDb();
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  if (result.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(result[0]);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { name, phone, image, avatarColor, profileComplete } = body;

  const db = getDb();

  // Build update object — only include provided fields
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (image !== undefined) updates.image = image;
  if (avatarColor !== undefined) updates.avatarColor = avatarColor;
  if (profileComplete !== undefined) updates.profileComplete = profileComplete;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  await db
    .update(users)
    .set(updates)
    .where(eq(users.email, session.user.email));

  // Return updated user
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  return NextResponse.json(result[0]);
}
