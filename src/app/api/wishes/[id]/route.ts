import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { bad, isHer, respond, unauthorized } from "@/lib/http";
import { db } from "@/db";
import { wishes } from "@/db/schema";

export const dynamic = "force-dynamic";

const ALLOWED = ["open", "granted", "declined"] as const;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const s = await getSession();
  if (!s) return unauthorized();
  if (!isHer(s)) return bad("愿望要不要兑现，她说了算", 403);

  const { id } = await context.params;
  let body: { status?: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return bad("请求格式不对");
  }

  const status = body.status as (typeof ALLOWED)[number];
  if (!ALLOWED.includes(status)) return bad("状态不合法");

  const updated = await db
    .update(wishes)
    .set({
      status,
      note: (body.note ?? "").trim().slice(0, 120) || null,
      resolvedAt: status === "open" ? null : new Date(),
    })
    .where(and(eq(wishes.id, id), eq(wishes.coupleId, s.coupleId)))
    .returning({ id: wishes.id });

  if (!updated[0]) return bad("愿望找不到了", 404);
  return respond(s);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const s = await getSession();
  if (!s) return unauthorized();

  const { id } = await context.params;
  const scope = and(eq(wishes.id, id), eq(wishes.coupleId, s.coupleId));

  if (!isHer(s)) {
    // 他只能撤回自己还没被处理的愿望
    const mine = await db
      .select({ id: wishes.id })
      .from(wishes)
      .where(and(scope, eq(wishes.ownerRole, "his"), eq(wishes.status, "open")))
      .limit(1);
    if (!mine[0]) return bad("这个愿望已经处理过了，撤不回啦", 403);
  }

  const removed = await db.delete(wishes).where(scope).returning({ id: wishes.id });
  if (!removed[0]) return bad("愿望找不到了", 404);
  return respond(s);
}
