import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { bad, isHer, respond, unauthorized } from "@/lib/http";
import { db } from "@/db";
import { stickerEntries } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const s = await getSession();
  if (!s) return unauthorized();
  if (!isHer(s)) return bad("只有她能撤销账本里的记录", 403);

  const { id } = await context.params;
  const removed = await db
    .delete(stickerEntries)
    .where(
      and(eq(stickerEntries.id, id), eq(stickerEntries.coupleId, s.coupleId)),
    )
    .returning({ id: stickerEntries.id });

  if (!removed[0]) return bad("这条记录已经不见了", 404);
  return respond(s);
}
