import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { stickerEntries, wishes, type Couple } from "@/db/schema";
import { DEFAULT_WISH_COST } from "@/lib/stickers";
import type {
  AppState,
  CoupleDTO,
  EntryDTO,
  MeDTO,
  Summary,
  WishDTO,
} from "@/lib/types";

export async function computeSummary(couple: Couple): Promise<Summary> {
  const cid = couple.id;

  const totals = await db
    .select({
      awarded: sql<number>`coalesce(sum(case when ${stickerEntries.kind} = 'award' then ${stickerEntries.amount} else 0 end), 0)::int`,
      deducted: sql<number>`coalesce(sum(case when ${stickerEntries.kind} = 'deduct' then ${stickerEntries.amount} else 0 end), 0)::int`,
    })
    .from(stickerEntries)
    .where(eq(stickerEntries.coupleId, cid));

  const reservedRow = await db
    .select({
      reserved: sql<number>`coalesce(sum(${wishes.cost}), 0)::int`,
      open: sql<number>`count(*) filter (where ${wishes.status} = 'open')::int`,
      granted: sql<number>`count(*) filter (where ${wishes.status} = 'granted')::int`,
    })
    .from(wishes)
    .where(
      and(eq(wishes.coupleId, cid), inArray(wishes.status, ["open", "granted"])),
    );

  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));

  const weekRow = await db
    .select({
      awarded: sql<number>`coalesce(sum(case when ${stickerEntries.kind} = 'award' then ${stickerEntries.amount} else 0 end), 0)::int`,
      deducted: sql<number>`coalesce(sum(case when ${stickerEntries.kind} = 'deduct' then ${stickerEntries.amount} else 0 end), 0)::int`,
    })
    .from(stickerEntries)
    .where(
      and(
        eq(stickerEntries.coupleId, cid),
        sql`${stickerEntries.createdAt} >= ${weekStart.toISOString()}`,
      ),
    );

  const awarded = Number(totals[0]?.awarded ?? 0);
  const deducted = Number(totals[0]?.deducted ?? 0);
  const balance = awarded - deducted;
  const reserved = Number(reservedRow[0]?.reserved ?? 0);
  const wishCost = couple.wishCost || DEFAULT_WISH_COST;
  const available = Math.max(0, balance - reserved);

  return {
    awarded,
    deducted,
    balance,
    reserved,
    available,
    wishCost,
    canWish: available >= wishCost,
    openWishes: Number(reservedRow[0]?.open ?? 0),
    grantedWishes: Number(reservedRow[0]?.granted ?? 0),
    weekAwarded: Number(weekRow[0]?.awarded ?? 0),
    weekDeducted: Number(weekRow[0]?.deducted ?? 0),
  };
}

export function toCoupleDTO(
  c: Couple,
  partnerJoined: boolean,
  role?: "her" | "his",
): CoupleDTO {
  return {
    id: c.id,
    code: c.code,
    // 她的登录码只发给她自己，他那边拿不到
    ownerKey: role === "her" ? c.ownerKey : null,
    herName: c.herName,
    hisName: c.hisName,
    wishCost: c.wishCost,
    hasPartner: partnerJoined,
  };
}

export async function getState(
  couple: Couple,
  me: MeDTO,
  partnerJoined: boolean,
): Promise<AppState> {
  const [entries, wishList, summary] = await Promise.all([
    db
      .select()
      .from(stickerEntries)
      .where(eq(stickerEntries.coupleId, couple.id))
      .orderBy(sql`${stickerEntries.createdAt} desc`)
      .limit(300),
    db
      .select()
      .from(wishes)
      .where(eq(wishes.coupleId, couple.id))
      .orderBy(sql`${wishes.createdAt} desc`),
    computeSummary(couple),
  ]);

  return {
    entries: entries.map<EntryDTO>((e) => ({
      id: e.id,
      kind: e.kind,
      actorRole: e.actorRole,
      amount: e.amount,
      icon: e.icon,
      label: e.label,
      reason: e.reason,
      createdAt: e.createdAt.toISOString(),
    })),
    wishes: wishList.map<WishDTO>((w) => ({
      id: w.id,
      title: w.title,
      detail: w.detail,
      ownerRole: w.ownerRole,
      cost: w.cost,
      status: w.status,
      note: w.note,
      createdAt: w.createdAt.toISOString(),
      resolvedAt: w.resolvedAt ? w.resolvedAt.toISOString() : null,
    })),
    couple: toCoupleDTO(couple, partnerJoined, me.role),
    me,
    summary,
  };
}

/** 校验一次奖罚操作，返回错误信息（null 表示通过） */
export function validateEntry(input: {
  kind?: string;
  amount?: number;
  reason?: string;
}): string | null {
  if (input.kind !== "award" && input.kind !== "deduct") {
    return "类型不对，只能奖励或扣除";
  }
  const amount = Number(input.amount);
  if (!Number.isInteger(amount) || amount < 1 || amount > 5) {
    return "一次最少 1 张、最多 5 张贴画";
  }
  const reason = (input.reason ?? "").trim();
  if (!reason) return "写一句原因吧，不然他会不服气的";
  if (reason.length > 120) return "原因太长啦，120 字以内";
  return null;
}
