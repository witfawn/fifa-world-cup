import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  image: text("image"),
  phone: text("phone"),
  avatarColor: text("avatar_color"),
  profileComplete: integer("profile_complete", { mode: "boolean" })
    .notNull()
    .$defaultFn(() => false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text("scope"),
    idToken: text("id_token"),
    sessionState: text("session_state"),
  },
  (t) => ({
    providerProviderAccountId: uniqueIndex("provider_provider_account_id").on(
      t.provider,
      t.providerAccountId
    ),
  })
);

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

// Pre-tournament predictions (who will win the World Cup, favorite team)
export const predictions = sqliteTable(
  "predictions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    winnerTeam: text("winner_team").notNull(),
    favoriteTeam: text("favorite_team").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => ({
    userIdx: uniqueIndex("user_idx").on(t.userId),
  })
);

// Match-by-match score predictions for the group stage
export const matchPredictions = sqliteTable(
  "match_predictions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    matchId: integer("match_id").notNull(),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
    pkWinner: text("pk_winner"), // 'home' | 'away' | null — knockout only
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => ({
    userMatchIdx: uniqueIndex("user_match_idx").on(t.userId, t.matchId),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Prediction = typeof predictions.$inferSelect;
export type NewPrediction = typeof predictions.$inferInsert;
export type MatchPrediction = typeof matchPredictions.$inferSelect;
export type NewMatchPrediction = typeof matchPredictions.$inferInsert;

// Payment tracking for entry fees
export const payments = sqliteTable("payments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amountCents: integer("amount_cents").notNull(),
  status: text("status", { enum: ["pending", "confirmed", "rejected"] })
    .notNull()
    .$defaultFn(() => "pending"),
  venmoNote: text("venmo_note"), // user's Venmo confirmation/note
  adminNotes: text("admin_notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

// Match results entered by admin
export const matchResults = sqliteTable("match_results", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  matchId: integer("match_id").notNull().unique(),
  homeScore: integer("home_score").notNull(),
  awayScore: integer("away_score").notNull(),
  pkWinner: text("pk_winner"), // 'home' | 'away' | null — knockout only
  isLocked: integer("is_locked", { mode: "boolean" })
    .notNull()
    .$defaultFn(() => false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type MatchResult = typeof matchResults.$inferSelect;
export type NewMatchResult = typeof matchResults.$inferInsert;

// Per-user points per match (calculated when game is locked)
export const userPoints = sqliteTable("user_points", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  matchId: integer("match_id").notNull(),
  points: integer("points").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (t) => ({
  userMatchIdx: uniqueIndex("points_user_match_idx").on(t.userId, t.matchId),
}));

export type UserPoint = typeof userPoints.$inferSelect;
export type NewUserPoint = typeof userPoints.$inferInsert;
