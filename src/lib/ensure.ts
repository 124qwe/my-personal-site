import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * 幂等建表，第一次请求时自动执行一次。
 * 即使用户忘了跑 `node scripts/bootstrap-db.mjs`，也能自救。
 */
const DDL = `
CREATE TABLE IF NOT EXISTS couples (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL UNIQUE,
  owner_key   text NOT NULL DEFAULT '',
  her_name    text NOT NULL DEFAULT '她',
  his_name    text NOT NULL DEFAULT '他',
  wish_cost   integer NOT NULL DEFAULT 20,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 老库升级：补上她的登录码字段
ALTER TABLE couples ADD COLUMN IF NOT EXISTS owner_key text NOT NULL DEFAULT '';

-- 给历史账本自动补一个登录码（只补空的，不动已有的）
UPDATE couples
SET owner_key = upper(substr(md5(random()::text || id::text), 1, 6))
WHERE owner_key = '';

CREATE UNIQUE INDEX IF NOT EXISTS couples_owner_key_uq
  ON couples (owner_key) WHERE owner_key <> '';

CREATE TABLE IF NOT EXISTS members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id   uuid NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  role        text NOT NULL,
  nickname    text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS members_couple_role_uq
  ON members (couple_id, role);

CREATE TABLE IF NOT EXISTS sessions (
  token       text PRIMARY KEY,
  couple_id   uuid NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  member_id   uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  role        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS sticker_entries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id   uuid NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  actor_role  text NOT NULL DEFAULT 'her',
  kind        text NOT NULL,
  amount      integer NOT NULL,
  icon        text NOT NULL,
  label       text NOT NULL,
  reason      text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sticker_entries_couple_created_idx
  ON sticker_entries (couple_id, created_at DESC);

CREATE TABLE IF NOT EXISTS wishes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id    uuid NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  owner_role   text NOT NULL DEFAULT 'his',
  title        text NOT NULL,
  detail       text,
  cost         integer NOT NULL DEFAULT 20,
  status       text NOT NULL DEFAULT 'open',
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  resolved_at  timestamptz
);
CREATE INDEX IF NOT EXISTS wishes_couple_idx ON wishes (couple_id);
`;

let ensured = false;

export async function ensureTables() {
  if (ensured) return;
  try {
    await db.execute(sql.raw(DDL));
    ensured = true;
  } catch (e) {
    // 如果是权限或连接问题，抛出去让上层处理
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("DATABASE_URL") || msg.includes("缺少 DATABASE_URL")) {
      throw e;
    }
    // 其他错误（比如表已存在）忽略，标记为已尝试
    ensured = true;
  }
}
