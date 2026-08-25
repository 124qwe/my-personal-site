import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { bad, isHer, respond, unauthorized } from "@/lib/http";
import { db } from "@/db";
import { stickerEntries, wishes } from "@/db/schema";

export const dynamic = "force-dynamic";

const SAMPLE: Array<{
  kind: "award" | "deduct";
  amount: number;
  icon: string;
  label: string;
  reason: string;
  hoursAgo: number;
}> = [
  { kind: "award", amount: 4, icon: "🐻", label: "抱抱贴", reason: "凌晨来接我下班，还带了热奶茶", hoursAgo: 96 },
  { kind: "award", amount: 3, icon: "🍜", label: "干饭贴", reason: "加班回来还给我煮了番茄鸡蛋面", hoursAgo: 74 },
  { kind: "award", amount: 3, icon: "🍓", label: "草莓贴", reason: "记得我不吃香菜，点菜都帮我挑出来", hoursAgo: 68 },
  { kind: "award", amount: 2, icon: "🧹", label: "家务贴", reason: "周末把阳台和厨房全收拾了", hoursAgo: 66 },
  { kind: "deduct", amount: 1, icon: "📱", label: "手机贴", reason: "吃饭的时候一直刷手机", hoursAgo: 60 },
  { kind: "award", amount: 2, icon: "💌", label: "情书贴", reason: "写了一整页的周年纪念", hoursAgo: 55 },
  { kind: "award", amount: 4, icon: "🎁", label: "惊喜贴", reason: "偷偷买了我说好看的那只发卡", hoursAgo: 50 },
  { kind: "deduct", amount: 2, icon: "🥶", label: "冷战贴", reason: "吵架先挂我电话", hoursAgo: 40 },
  { kind: "award", amount: 2, icon: "🌈", label: "哄人贴", reason: "我闹脾气，他哄了半小时没不耐烦", hoursAgo: 30 },
  { kind: "award", amount: 1, icon: "🌙", label: "晚安贴", reason: "连续一周都记得说晚安", hoursAgo: 22 },
  { kind: "deduct", amount: 2, icon: "⏰", label: "迟到贴", reason: "看电影迟到 25 分钟", hoursAgo: 19 },
  { kind: "award", amount: 5, icon: "🌟", label: "星星贴", reason: "自己把体检报告拿给我看，还改了作息", hoursAgo: 12 },
  { kind: "award", amount: 5, icon: "🏆", label: "冠军贴", reason: "生病那天整夜陪我，满分", hoursAgo: 8 },
  { kind: "award", amount: 5, icon: "🐱", label: "撒娇贴", reason: "学猫叫哄我，虽然很傻但很好笑", hoursAgo: 6 },
  { kind: "award", amount: 5, icon: "🍓", label: "草莓贴", reason: "把我随口说想吃的那家店找到了", hoursAgo: 4 },
  { kind: "award", amount: 3, icon: "🧹", label: "家务贴", reason: "猫砂盆和地板都弄干净了", hoursAgo: 3 },
  { kind: "award", amount: 4, icon: "💪", label: "靠谱贴", reason: "说到做到，把我家的灯全修好了", hoursAgo: 2 },
  { kind: "deduct", amount: 2, icon: "🧦", label: "乱扔贴", reason: "袜子又丢在沙发上", hoursAgo: 1 },
];

export async function POST() {
  const s = await getSession();
  if (!s) return unauthorized();
  if (!isHer(s)) return bad("只有她能载入示例账本", 403);

  const existing = await db
    .select({ id: stickerEntries.id })
    .from(stickerEntries)
    .where(eq(stickerEntries.coupleId, s.coupleId))
    .limit(1);
  if (existing[0]) return bad("账本里已经有记录了，不用示例啦");

  const now = Date.now();
  await db.insert(stickerEntries).values(
    SAMPLE.map((x) => ({
      coupleId: s.coupleId,
      actorRole: s.role,
      kind: x.kind,
      amount: x.amount,
      icon: x.icon,
      label: x.label,
      reason: x.reason,
      createdAt: new Date(now - x.hoursAgo * 3600 * 1000),
    })),
  );

  await db.insert(wishes).values({
    coupleId: s.coupleId,
    ownerRole: "his",
    title: "一整天的自由游戏日",
    detail: "从早到晚不许催我，饭我自己解决",
    cost: s.couple.wishCost,
    status: "granted",
    note: "答应啦，记得别熬太晚",
    resolvedAt: new Date(now - 5 * 3600 * 1000),
  });

  return respond(s);
}

export async function DELETE() {
  const s = await getSession();
  if (!s) return unauthorized();
  if (!isHer(s)) return bad("只有她能清空账本", 403);

  await db.delete(wishes).where(eq(wishes.coupleId, s.coupleId));
  await db.delete(stickerEntries).where(eq(stickerEntries.coupleId, s.coupleId));
  return respond(s);
}
