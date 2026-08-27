import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
};

export const pairs = pgTable(
  "pairs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 16 }).notNull(),
    codeUsedAt: timestamp("code_used_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [uniqueIndex("pairs_code_unique").on(table.code)],
);

export const members = pgTable(
  "members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pairId: uuid("pair_id")
      .notNull()
      .references(() => pairs.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 12 }).notNull(),
    nickname: varchar("nickname", { length: 40 }).notNull(),
    token: varchar("token", { length: 96 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("members_token_unique").on(table.token),
    uniqueIndex("members_pair_role_unique").on(table.pairId, table.role),
  ],
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pairId: uuid("pair_id")
      .notNull()
      .references(() => pairs.id, { onDelete: "cascade" }),
    cups: integer("cups").default(1).notNull(),
    ml: integer("ml").notNull(),
    loveNote: text("love_note"),
    miniTask: text("mini_task"),
    emoji: varchar("emoji", { length: 16 }).default("💧").notNull(),
    kind: varchar("kind", { length: 16 }).default("manual").notNull(),
    status: varchar("status", { length: 24 }).default("pending_accept").notNull(),
    acceptDeadline: timestamp("accept_deadline", { withTimezone: true }).notNull(),
    finishDeadline: timestamp("finish_deadline", { withTimezone: true }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    startPhotoUrl: text("start_photo_url"),
    endPhotoUrl: text("end_photo_url"),
    rejectReason: text("reject_reason"),
    failReason: text("fail_reason"),
    ...timestamps,
  },
  (table) => [
    index("tasks_pair_created_idx").on(table.pairId, table.createdAt),
    index("tasks_pair_status_idx").on(table.pairId, table.status),
  ],
);

export const dropsLedger = pgTable(
  "drops_ledger",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pairId: uuid("pair_id")
      .notNull()
      .references(() => pairs.id, { onDelete: "cascade" }),
    delta: integer("delta").notNull(),
    reason: text("reason").notNull(),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [index("drops_pair_created_idx").on(table.pairId, table.createdAt)],
);

export const medals = pgTable(
  "medals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pairId: uuid("pair_id")
      .notNull()
      .references(() => pairs.id, { onDelete: "cascade" }),
    delta: integer("delta").notNull(),
    reason: text("reason").notNull(),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [index("medals_pair_created_idx").on(table.pairId, table.createdAt)],
);

export const rewards = pgTable(
  "rewards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pairId: uuid("pair_id")
      .notNull()
      .references(() => pairs.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 120 }).notNull(),
    description: text("description"),
    emoji: varchar("emoji", { length: 16 }).default("🎁").notNull(),
    cost: integer("cost").default(20).notNull(),
    active: boolean("active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [index("rewards_pair_active_idx").on(table.pairId, table.active)],
);

export const redemptions = pgTable(
  "redemptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pairId: uuid("pair_id")
      .notNull()
      .references(() => pairs.id, { onDelete: "cascade" }),
    rewardId: uuid("reward_id")
      .notNull()
      .references(() => rewards.id, { onDelete: "restrict" }),
    rewardTitle: varchar("reward_title", { length: 120 }).notNull(),
    cost: integer("cost").notNull(),
    status: varchar("status", { length: 16 }).default("pending").notNull(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("redemptions_pair_created_idx").on(table.pairId, table.createdAt)],
);

export const cheers = pgTable(
  "cheers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pairId: uuid("pair_id")
      .notNull()
      .references(() => pairs.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    emoji: varchar("emoji", { length: 16 }).default("💕").notNull(),
    ...timestamps,
  },
  (table) => [index("cheers_pair_created_idx").on(table.pairId, table.createdAt)],
);

export type Task = typeof tasks.$inferSelect;
export type Reward = typeof rewards.$inferSelect;
export type Redemption = typeof redemptions.$inferSelect;
export type Cheer = typeof cheers.$inferSelect;
