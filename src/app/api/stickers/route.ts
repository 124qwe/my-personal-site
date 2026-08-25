import { getSession } from "@/lib/auth";
import { bad, handleDbError, isHer, respond, unauthorized } from "@/lib/http";
import { db } from "@/db";
import { stickerEntries } from "@/db/schema";
import { ensureTables } from "@/lib/ensure";
import { validateEntry } from "@/lib/state";
import { AWARD_STICKERS, DEDUCT_STICKERS, pickSticker } from "@/lib/stickers";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await ensureTables();
    const s = await getSession();
    if (!s) return unauthorized();
    if (!isHer(s)) return bad("贴画只有她能发哦", 403);

    let body: { kind?: string; amount?: number; icon?: string; reason?: string };
    try {
      body = await request.json();
    } catch {
      return bad("请求格式不对");
    }

    const invalid = validateEntry(body);
    if (invalid) return bad(invalid);

    const kind = body.kind as "award" | "deduct";
    const list = kind === "award" ? AWARD_STICKERS : DEDUCT_STICKERS;
    const sticker = pickSticker(list, body.icon ?? "") ?? list[0];

    await db.insert(stickerEntries).values({
      coupleId: s.coupleId,
      actorRole: s.role,
      kind,
      amount: Number(body.amount),
      icon: sticker.icon,
      label: sticker.label,
      reason: (body.reason ?? "").trim(),
    });

    return await respond(s);
  } catch (err) {
    return handleDbError(err) ?? (() => { throw err; })();
  }
}
