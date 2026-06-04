import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyMagicToken } from "@/lib/magic-link";

const AVATAR_COLORS = [
  "#d4a843", // gold
  "#3b82f6", // blue
  "#22c55e", // green
  "#a855f7", // purple
  "#ec4899", // pink
  "#f97316", // orange
  "#14b8a6", // teal
  "#ef4444", // red
];

function getRandomColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Magic Link",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.token) return null;

        const email = await verifyMagicToken(credentials.token);
        if (!email) return null;

        // Look up or create user in DB
        try {
          const { getDb } = await import("@/lib/db");
          const { users } = await import("@/lib/db/schema");
          const { eq } = await import("drizzle-orm");

          const db = getDb();
          const existing = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (existing.length > 0) {
            return {
              id: existing[0].id,
              email: existing[0].email,
              name: existing[0].name,
              image: existing[0].image,
            };
          }

          // New user — create account
          const id = crypto.randomUUID();
          const name = email.split("@")[0];
          await db.insert(users).values({
            id,
            email,
            name,
            image: null,
            avatarColor: getRandomColor(),
            profileComplete: false,
          });

          return { id, email, name, image: null };
        } catch (err) {
          console.error("Magic link auth error:", err);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.id = account.providerAccountId || user?.id;
      }
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      // Only run on actual sign-in (not token refresh)
      if (account?.provider === "google" && user.email) {
        try {
          const { getDb } = await import("@/lib/db");
          const { users } = await import("@/lib/db/schema");
          const { eq } = await import("drizzle-orm");

          const db = getDb();
          const existing = await db
            .select()
            .from(users)
            .where(eq(users.email, user.email))
            .limit(1);

          if (existing.length === 0) {
            // First time — create user in DB
            await db.insert(users).values({
              id: user.id || crypto.randomUUID(),
              email: user.email,
              name: user.name || "Unknown",
              image: user.image || null,
              avatarColor: getRandomColor(),
              profileComplete: false,
            });
          }
        } catch (err) {
          console.error("Error creating user in DB:", err);
          // Don't block sign-in if DB fails
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
};
