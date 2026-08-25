import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

type GlobalCache = typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsDrizzle?: ReturnType<typeof drizzle>;
};

const globalForDb = globalThis as GlobalCache;

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      [
        "缺少 DATABASE_URL 环境变量。",
        "",
        "本地开发：",
        "1. 复制 .env.example 为 .env",
        "2. 填入你的 PostgreSQL 地址，例如：",
        "   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db",
        "3. 确保 Postgres 已启动，然后运行：",
        "   node scripts/bootstrap-db.mjs",
        "   npm run dev",
        "",
        "线上部署：",
        "在 Vercel / Railway / Docker 的环境变量里添加 DATABASE_URL，",
        "例如 Neon 的 pooled 连接串：",
        "DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.neon.tech/neondb?sslmode=require",
      ].join("\n"),
    );
  }
  return url;
}

function getPool(): Pool {
  if (globalForDb.__arenaNextJsPostgresqlPool) {
    return globalForDb.__arenaNextJsPostgresqlPool;
  }
  const pool = new Pool({
    connectionString: getDatabaseUrl(),
  });
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsPostgresqlPool = pool;
  }
  return pool;
}

function getDrizzle() {
  if (globalForDb.__arenaNextJsDrizzle) {
    return globalForDb.__arenaNextJsDrizzle;
  }
  const d = drizzle(getPool());
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsDrizzle = d;
  }
  return d;
}

/**
 * 懒代理：import 时不连接数据库，第一次真正使用 db.xxx 时才去连。
 * 这样缺配置时不会在模块加载阶段就让整个 Next.js 崩掉，
 * 而是能在页面里捕获并展示友好提示。
 */
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop, receiver) {
    const real = getDrizzle() as unknown as Record<string | symbol, unknown>;
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? (value as Function).bind(real) : value;
  },
});

export const pool = new Proxy({} as Pool, {
  get(_target, prop, receiver) {
    const real = getPool() as unknown as Record<string | symbol, unknown>;
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? (value as Function).bind(real) : value;
  },
});
