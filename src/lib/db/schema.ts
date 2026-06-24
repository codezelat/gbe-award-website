import { relations, sql } from "drizzle-orm";
import { boolean, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("account_user_id_idx").on(table.userId),
    uniqueIndex("account_provider_account_idx").on(table.providerId, table.accountId),
  ],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const contentStatus = pgEnum("content_status", ["draft", "published", "archived"]);
export const nominationStatus = pgEnum("nomination_status", ["draft", "submitted", "shortlisted", "published", "archived"]);

export const pastWinners = pgTable(
  "past_winners",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
    awardTitle: text("award_title").notNull(),
    recipientName: text("recipient_name").notNull(),
    organization: text("organization"),
    category: text("category").notNull(),
    year: integer("year").notNull().default(2026),
    market: text("market").notNull().default("International"),
    summary: text("summary").notNull().default(""),
    imageUrl: text("image_url"),
    slug: text("slug").notNull(),
    status: contentStatus("status").notNull().default("draft"),
    sortOrder: integer("sort_order").notNull().default(0),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("past_winners_slug_idx").on(table.slug),
    index("past_winners_search_idx").on(table.awardTitle, table.recipientName, table.category),
    index("past_winners_status_year_idx").on(table.status, table.year),
  ],
);

export const nominations = pgTable(
  "nominations",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
    awardTitle: text("award_title").notNull(),
    nomineeName: text("nominee_name").notNull(),
    organization: text("organization"),
    category: text("category").notNull(),
    year: integer("year").notNull().default(2026),
    market: text("market").notNull().default("International"),
    summary: text("summary").notNull().default(""),
    notes: text("notes").notNull().default(""),
    imageUrl: text("image_url"),
    slug: text("slug").notNull(),
    status: nominationStatus("status").notNull().default("draft"),
    sortOrder: integer("sort_order").notNull().default(0),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("nominations_slug_idx").on(table.slug),
    index("nominations_search_idx").on(table.awardTitle, table.nomineeName, table.category),
    index("nominations_status_year_idx").on(table.status, table.year),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export type PastWinner = typeof pastWinners.$inferSelect;
export type NewPastWinner = typeof pastWinners.$inferInsert;
export type Nomination = typeof nominations.$inferSelect;
export type NewNomination = typeof nominations.$inferInsert;
