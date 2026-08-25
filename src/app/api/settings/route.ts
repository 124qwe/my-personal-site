import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { bad, handleDbError, isHer, respond, unauthorized } from "@/lib/http";
import { db } from "@/db";
import { couples, members } from "@/db/schema";
import { ensureTables } from "@/lib/ensure";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  try {
    await ensureTables();
    const s = await getSession();
    if (!s) return unauthorized();
    if (!isHer(s)) return bad("账本设置只有她能改", 403);

    let body: { herName?: string; hisName?: string; wishCost?: number };
    try {
      body = await request.json();
    } catch {
      return bad("请求格式不对");
    }

    const herName = (body.herName ?? "").trim();
    const hisName = (body.hisName ?? "").trim();
    const wishCost = Number(body.wishCost);

    if (!herName || herName.length > 12) return bad("她的昵称 1–12 字");
    if (!hisName || hisName.length > 12) return bad("他的昵称 1–12 字");
    if (!Number.isInteger(wishCost) || wishCost < 5 || wishCost > 99)
      return bad("许愿门槛填 5–99 之间的整数");

    await db
      .update(couples)
      .set({ herName, hisName, wishCost })
      .where(eq(couples.id, s.coupleId));

    await db
      .update(members)
      .set({ nickname: herName })
      .where(eq(members.id, s.memberId));

    const fresh = await getSession();
    return await respond(fresh ?? s);
  } catch (err) {
    return handleDbError(err) ?? (() => { throw err; })();
  }
}
