import { NextResponse } from "next/server";
import { toMeDTO, type Session } from "@/lib/auth";
import { getState } from "@/lib/state";
import { ensureTables } from "@/lib/ensure";

export const dynamic = "force-dynamic";

export function unauthorized() {
  return NextResponse.json(
    { error: "登录状态失效了，重新进入一下" },
    { status: 401 },
  );
}

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function isDbConfigError(err: unknown): boolean {
  const m = err instanceof Error ? err.message : String(err);
  return m.includes("DATABASE_URL") || m.includes("缺少 DATABASE_URL");
}

function isMissingTableError(err: unknown): boolean {
  const m = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    m.includes("does not exist") ||
    m.includes("relation") ||
    m.includes("no such table") ||
    m.includes("undefined_table")
  );
}

export async function respond(s: Session) {
  try {
    await ensureTables();
    return NextResponse.json(
      await getState(s.couple, toMeDTO(s), s.partnerJoined),
    );
  } catch (err) {
    if (isDbConfigError(err)) {
      return NextResponse.json(
        {
          error:
            "数据库还没配好：缺少 DATABASE_URL。本地请复制 .env.example 为 .env，线上请在环境变量里添加 DATABASE_URL。",
        },
        { status: 500 },
      );
    }
    if (isMissingTableError(err)) {
      try {
        await ensureTables();
        return NextResponse.json(
          await getState(s.couple, toMeDTO(s), s.partnerJoined),
        );
      } catch (e2) {
        return NextResponse.json(
          {
            error:
              "数据库表还没建，正在自动建表，刷新一下试试。如果一直失败，请手动运行：node scripts/bootstrap-db.mjs",
          },
          { status: 500 },
        );
      }
    }
    throw err;
  }
}

export function isHer(s: Session) {
  return s.role === "her";
}

export function handleDbError(err: unknown) {
  const raw = err instanceof Error ? err.message : String(err);
  if (isDbConfigError(err)) {
    return bad(
      "数据库还没配好：缺少 DATABASE_URL。本地请复制 .env.example 为 .env 并填入 Postgres 地址。",
      500,
    );
  }
  if (isMissingTableError(err)) {
    return bad(
      `数据库表还没建（${raw.slice(0, 120)}）。请先运行：node scripts/bootstrap-db.mjs，然后刷新页面。`,
      500,
    );
  }
  // 其他错误也返回 JSON，而不是让 Next.js 返回 HTML
  return bad(raw.slice(0, 200) || "服务器开小差了，再试一次", 500);
}
