import {
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export type Role = "her" | "his";

/** 一对情侣 = 一个共享账本 */
export const couples = pgTable("couples", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** 给他的邀请码 */
  code: text("code").notNull().unique(),
  /** 她自己的登录码：换手机 / 平板时用这个进，身份仍是「她」 */
  ownerKey: text("owner_key").notNull().default(""),
  herName: text("her_name").notNull().default("她"),
  hisName: text("his_name").notNull().default("他"),
  wishCost: integer("wish_cost").notNull().default(20),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** 账本里的成员：邀请方固定 her，被邀请方固定 his */
export const members = pgTable(
  "members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    coupleId: uuid("couple_id")
      .notNull()
      .references(() => couples.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["her", "his"] }).notNull(),
    nickname: text("nickname").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("members_couple_role_uq").on(t.coupleId, t.role)],
);

/** 登录会话（httpOnly cookie 里只放 token） */
export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  coupleId: uuid("couple_id")
    .notNull()
    .references(() => couples.id, { onDelete: "cascade" }),
  memberId: uuid("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["her", "his"] }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

/** 贴画流水 */
export const stickerEntries = pgTable("sticker_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  coupleId: uuid("couple_id")
    .notNull()
    .references(() => couples.id, { onDelete: "cascade" }),
  actorRole: text("actor_role", { enum: ["her", "his"] })
    .notNull()
    .default("her"),
  kind: text("kind", { enum: ["award", "deduct"] }).notNull(),
  amount: integer("amount").notNull(),
  icon: text("icon").notNull(),
  label: text("label").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** 愿望 */
export const wishes = pgTable("wishes", {
  id: uuid("id").primaryKey().defaultRandom(),
  coupleId: uuid("couple_id")
    .notNull()
    .references(() => couples.id, { onDelete: "cascade" }),
  ownerRole: text("owner_role", { enum: ["her", "his"] })
    .notNull()
    .default("his"),
  title: text("title").notNull(),
  detail: text("detail"),
  cost: integer("cost").notNull().default(20),
  status: text("status", { enum: ["open", "granted", "declined"] })
    .notNull()
    .default("open"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export type Couple = typeof couples.$inferSelect;
export type Member = typeof members.$inferSelect;
export type StickerEntry = typeof stickerEntries.$inferSelect;
export type Wish = typeof wishes.$inferSelect;
