import { getSession } from "@/lib/auth";
import { bad, respond, unauthorized } from "@/lib/http";
import { db } from "@/db";
import { wishes } from "@/db/schema";
import { computeSummary } from "@/lib/state";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const s = await getSession();
  if (!s) return unauthorized();
  if (s.role !== "his") return bad("许愿是他的专属权利", 403);

  let body: { title?: string; detail?: string };
  try {
    body = await request.json();
  } catch {
    return bad("请求格式不对");
  }

  const title = (body.title ?? "").trim();
  const detail = (body.detail ?? "").trim();
  if (!title) return bad("愿望还没写呢");
  if (title.length > 40) return bad("愿望标题 40 字以内");
  if (detail.length > 200) return bad("愿望描述 200 字以内");

  const before = await computeSummary(s.couple);
  if (!before.canWish) {
    return bad(
      `贴画不够呀，还差 ${Math.max(0, before.wishCost - before.available)} 张才能许愿`,
    );
  }

  await db.insert(wishes).values({
    coupleId: s.coupleId,
    ownerRole: s.role,
    title,
    detail: detail || null,
    cost: before.wishCost,
  });

  return respond(s);
}
