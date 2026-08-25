import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { bad, handleDbError, isHer, respond, unauthorized } from "@/lib/http";
import { db } from "@/db";
import { stickerEntries, wishes } from "@/db/schema";
import { ensureTables } from "@/lib/ensure";

export const dynamic = "force-dynamic";

/** 清空这本账里的所有贴画与愿望（昵称、邀请码、登录码保留） */
export async function DELETE() {
  try {
    await ensureTables();
    const s = await getSession();
    if (!s) return unauthorized();
    if (!isHer(s)) return bad("只有她能清空账本", 403);

    await db.delete(wishes).where(eq(wishes.coupleId, s.coupleId));
    await db.delete(stickerEntries).where(eq(stickerEntries.coupleId, s.coupleId));
    return await respond(s);
  } catch (err) {
    return handleDbError(err) ?? (() => { throw err; })();
  }
}
