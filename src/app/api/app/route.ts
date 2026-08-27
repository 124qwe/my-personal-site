import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, desc, eq, gte, inArray, isNotNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  cheers,
  dropsLedger,
  medals,
  members,
  pairs,
  redemptions,
  rewards,
  tasks,
} from "@/db/schema";

export const dynamic = "force-dynamic";

const SESSION_COOKIE = "gudu_session";
const PHOTO_MAX_LENGTH = 2_000_000;

function fail(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

function text(value: unknown, max = 300) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function integer(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
}

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(4);
  return `GUDU-${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")}`;
}

function makeToken() {
  return randomBytes(36).toString("base64url");
}

function validPhoto(value: unknown) {
  return (
    typeof value === "string" &&
    value.startsWith("data:image/") &&
    value.length > 100 &&
    value.length <= PHOTO_MAX_LENGTH
  );
}

async function session() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [member] = await db.select().from(members).where(eq(members.token, token)).limit(1);
  return member ?? null;
}

async function dropBalance(pairId: string) {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${dropsLedger.delta}), 0)::int` })
    .from(dropsLedger)
    .where(eq(dropsLedger.pairId, pairId));
  return Number(row?.total ?? 0);
}

async function medalBalance(pairId: string) {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${medals.delta}), 0)::int` })
    .from(medals)
    .where(eq(medals.pairId, pairId));
  return Number(row?.total ?? 0);
}

async function applyFailure(taskId: string, pairId: string, reason: string) {
  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(tasks)
      .set({ status: "failed", failReason: reason, reviewedAt: new Date() })
      .where(and(eq(tasks.id, taskId), inArray(tasks.status, ["pending_accept", "in_progress", "pending_review"])))
      .returning({ id: tasks.id });

    if (!updated) return;

    const [balance] = await tx
      .select({ total: sql<number>`coalesce(sum(${dropsLedger.delta}), 0)::int` })
      .from(dropsLedger)
      .where(eq(dropsLedger.pairId, pairId));

    if (Number(balance?.total ?? 0) > 0) {
      await tx.insert(dropsLedger).values({
        pairId,
        taskId,
        delta: -1,
        reason: "任务超时，小水滴蒸发了一朵",
      });
    }
  });
}

async function maintainPair(pairId: string) {
  const now = new Date();
  const overdueAccept = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(
      and(
        eq(tasks.pairId, pairId),
        eq(tasks.status, "pending_accept"),
        lt(tasks.acceptDeadline, now),
      ),
    );

  const overdueFinish = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(
      and(
        eq(tasks.pairId, pairId),
        eq(tasks.status, "in_progress"),
        lt(tasks.finishDeadline, now),
      ),
    );

  for (const item of overdueAccept) {
    await applyFailure(item.id, pairId, "30 分钟内未开始");
  }
  for (const item of overdueFinish) {
    await applyFailure(item.id, pairId, "开始后 2 小时内未喝完");
  }

  const photoCutoff = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  await db
    .update(tasks)
    .set({ startPhotoUrl: null, endPhotoUrl: null })
    .where(
      and(
        eq(tasks.pairId, pairId),
        lt(tasks.createdAt, photoCutoff),
        isNotNull(tasks.startPhotoUrl),
      ),
    );
}

async function ensureDailyTasks(pairId: string) {
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const sixAm = new Date(now);
  sixAm.setHours(6, 0, 0, 0);
  // 截止时间：当天 24:00（晚上 12 点 = 次日 00:00）
  const deadline = new Date(now);
  deadline.setHours(24, 0, 0, 0);
  // 只在 6:00 ~ 24:00 之间补发；24 点后不再创建（避免创建即超时）
  if (now.getTime() < sixAm.getTime() || now.getTime() >= deadline.getTime()) return;

  const [existing] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.pairId, pairId), eq(tasks.kind, "daily"), gte(tasks.createdAt, dayStart)))
    .limit(1);
  if (existing) return;

  await db.insert(tasks).values([
    {
      pairId,
      ml: 500,
      cups: 1,
      kind: "daily",
      emoji: "💧",
      status: "in_progress",
      acceptDeadline: deadline,
      finishDeadline: deadline,
      acceptedAt: now,
      startedAt: now,
      loveNote: "每日小目标：今晚 12 点前喝完 500ml",
    },
    {
      pairId,
      ml: 500,
      cups: 1,
      kind: "daily",
      emoji: "💧",
      status: "in_progress",
      acceptDeadline: deadline,
      finishDeadline: deadline,
      acceptedAt: now,
      startedAt: now,
      loveNote: "每日小目标：今晚 12 点前喝完 500ml",
    },
  ]);
}

async function getSnapshot(member: NonNullable<Awaited<ReturnType<typeof session>>>) {
  await maintainPair(member.pairId);
  await ensureDailyTasks(member.pairId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [pairRows, memberRows, taskRows, rewardRows, redemptionRows, cheerRows, dropRows, medalRows, drops, medalCount] =
    await Promise.all([
      db.select().from(pairs).where(eq(pairs.id, member.pairId)).limit(1),
      db.select({ role: members.role }).from(members).where(eq(members.pairId, member.pairId)),
      db.select().from(tasks).where(eq(tasks.pairId, member.pairId)).orderBy(desc(tasks.createdAt)).limit(80),
      db.select().from(rewards).where(eq(rewards.pairId, member.pairId)).orderBy(desc(rewards.active), desc(rewards.createdAt)),
      db.select().from(redemptions).where(eq(redemptions.pairId, member.pairId)).orderBy(desc(redemptions.createdAt)).limit(50),
      db.select().from(cheers).where(eq(cheers.pairId, member.pairId)).orderBy(desc(cheers.createdAt)).limit(30),
      db.select().from(dropsLedger).where(eq(dropsLedger.pairId, member.pairId)).orderBy(desc(dropsLedger.createdAt)).limit(80),
      db.select().from(medals).where(eq(medals.pairId, member.pairId)).orderBy(desc(medals.createdAt)).limit(50),
      dropBalance(member.pairId),
      medalBalance(member.pairId),
    ]);
  const todaysTasks = taskRows.filter((task) => task.createdAt >= today);
  const todayDrops = dropRows
    .filter((row) => row.createdAt >= today)
    .reduce((sum, row) => sum + row.delta, 0);

  return {
    authenticated: true as const,
    role: member.role,
    nickname: member.nickname,
    pairCode: pairRows[0]?.code ?? "",
    paired: memberRows.some((item) => item.role === "star"),
    drops: Math.max(0, drops),
    medals: Math.max(0, medalCount),
    tasks: taskRows,
    rewards: rewardRows,
    redemptions: redemptionRows,
    cheers: cheerRows,
    ledger: [
      ...dropRows.map((row) => ({ ...row, kind: "drop" as const })),
      ...medalRows.map((row) => ({ ...row, kind: "medal" as const })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    today: {
      sent: todaysTasks.length,
      completed: todaysTasks.filter((task) => task.status === "completed").length,
      failed: todaysTasks.filter((task) => task.status === "failed").length,
      skipped: todaysTasks.filter((task) => task.status === "skipped").length,
      ml: todaysTasks
        .filter((task) => task.status === "completed")
        .reduce((sum, task) => sum + task.ml * task.cups, 0),
      netDrops: todayDrops,
    },
    serverNow: new Date().toISOString(),
  };
}

export async function GET() {
  const member = await session();
  if (!member) return Response.json({ authenticated: false });
  return Response.json(await getSnapshot(member));
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail("请求格式不正确");
  }

  const action = text(body.action, 40);

  if (action === "create_pair") {
    let code = makeCode();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const [existing] = await db.select({ id: pairs.id }).from(pairs).where(eq(pairs.code, code)).limit(1);
      if (!existing) break;
      code = makeCode();
    }
    const token = makeToken();

    await db.transaction(async (tx) => {
      const [pair] = await tx.insert(pairs).values({ code }).returning();
      await tx.insert(members).values({
        pairId: pair.id,
        role: "sender",
        nickname: text(body.nickname, 40) || "咕嘟发送机",
        token,
      });
      await tx.insert(rewards).values([
        { pairId: pair.id, title: "奶茶券一张", description: "选一家喜欢的店，今天甜一点", emoji: "🧋", cost: 20 },
        { pairId: pair.id, title: "一天听你指挥", description: "合理范围内，无条件响应星人指令", emoji: "🫡", cost: 20 },
        { pairId: pair.id, title: "按摩 20 分钟", description: "肩颈、手臂或小腿，任选一处", emoji: "💆", cost: 20 },
      ]);
    });

    const store = await cookies();
    store.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
    return Response.json({ ok: true, code });
  }

  if (action === "join_pair") {
    const code = text(body.code, 16).toUpperCase();
    if (!/^GUDU-[A-Z2-9]{4}$/.test(code)) return fail("这枚配对码好像不对");

    const [pair] = await db.select().from(pairs).where(eq(pairs.code, code)).limit(1);
    if (!pair) return fail("没有找到这颗星球", 404);
    if (pair.codeUsedAt) return fail("这枚配对码已经完成使命啦", 409);

    const token = makeToken();
    try {
      await db.transaction(async (tx) => {
        await tx.insert(members).values({
          pairId: pair.id,
          role: "star",
          nickname: text(body.nickname, 40) || "咕嘟咕嘟星人",
          token,
        });
        await tx.update(pairs).set({ codeUsedAt: new Date() }).where(and(eq(pairs.id, pair.id), sql`${pairs.codeUsedAt} is null`));
      });
    } catch {
      return fail("这枚配对码已经被使用", 409);
    }

    const store = await cookies();
    store.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
    return Response.json({ ok: true });
  }

  if (action === "logout") {
    const store = await cookies();
    store.delete(SESSION_COOKIE);
    return Response.json({ ok: true });
  }

  const member = await session();
  if (!member) return fail("请先回到自己的星球", 401);

  const senderOnly = () => member.role === "sender";
  const starOnly = () => member.role === "star";

  if (action === "create_task") {
    if (!senderOnly()) return fail("只有发送机能派水", 403);
    const ml = Math.min(3000, Math.max(50, integer(body.ml, 300)));
    const cups = Math.min(10, Math.max(1, integer(body.cups, 1)));
    await db.insert(tasks).values({
      pairId: member.pairId,
      ml,
      cups,
      loveNote: text(body.loveNote, 240) || null,
      miniTask: text(body.miniTask, 240) || null,
      emoji: text(body.emoji, 16) || "💧",
      acceptDeadline: new Date(Date.now() + 30 * 60 * 1000),
    });
    return Response.json({ ok: true, message: "咕嘟指令已发射" });
  }

  if (action === "edit_task") {
    if (!senderOnly()) return fail("只有发送机能修改任务", 403);
    const [updated] = await db
      .update(tasks)
      .set({
        ml: Math.min(3000, Math.max(50, integer(body.ml, 300))),
        cups: Math.min(10, Math.max(1, integer(body.cups, 1))),
        loveNote: text(body.loveNote, 240) || null,
        miniTask: text(body.miniTask, 240) || null,
        emoji: text(body.emoji, 16) || "💧",
      })
      .where(
        and(
          eq(tasks.id, text(body.taskId, 40)),
          eq(tasks.pairId, member.pairId),
          eq(tasks.status, "pending_accept"),
        ),
      )
      .returning({ id: tasks.id });
    if (!updated) return fail("星人已经开始，这杯不能再改了");
    return Response.json({ ok: true, message: "咕嘟指令已更新" });
  }

  if (action === "cancel_task") {
    if (!senderOnly()) return fail("没有操作权限", 403);
    const [updated] = await db
      .update(tasks)
      .set({ status: "cancelled", failReason: "发送机已撤回", reviewedAt: new Date() })
      .where(and(eq(tasks.id, text(body.taskId, 40)), eq(tasks.pairId, member.pairId), eq(tasks.status, "pending_accept")))
      .returning({ id: tasks.id });
    if (!updated) return fail("这条指令已经不能撤回");
    return Response.json({ ok: true });
  }

  if (action === "accept_task") {
    if (!starOnly()) return fail("只有星人能接任务", 403);
    if (!validPhoto(body.photo)) return fail("请先拍一张清晰的开始照片");
    const now = new Date();
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, text(body.taskId, 40)), eq(tasks.pairId, member.pairId)))
      .limit(1);
    if (!task || task.status !== "pending_accept") return fail("任务状态已经变化");
    if (task.acceptDeadline < now) {
      await applyFailure(task.id, member.pairId, "30 分钟内未开始");
      return fail("开始时间已过，小水滴蒸发了一朵…");
    }
    await db
      .update(tasks)
      .set({
        status: "in_progress",
        acceptedAt: now,
        startedAt: now,
        finishDeadline: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        startPhotoUrl: body.photo as string,
        rejectReason: null,
      })
      .where(and(eq(tasks.id, task.id), eq(tasks.status, "pending_accept")));
    return Response.json({ ok: true, message: "星人已就位，准备咕嘟" });
  }

  if (action === "submit_task") {
    if (!starOnly()) return fail("只有星人能提交照片", 403);
    if (!validPhoto(body.photo)) return fail("请拍一张喝完照片");
    const now = new Date();
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, text(body.taskId, 40)), eq(tasks.pairId, member.pairId)))
      .limit(1);
    if (!task || task.status !== "in_progress") return fail("任务状态已经变化");
    if (!task.finishDeadline || task.finishDeadline < now) {
      await applyFailure(task.id, member.pairId, "开始后 2 小时内未喝完");
      return fail("完成时间已过，小水滴蒸发了一朵…");
    }
    await db
      .update(tasks)
      .set({ status: "pending_review", submittedAt: now, endPhotoUrl: body.photo as string })
      .where(and(eq(tasks.id, task.id), eq(tasks.status, "in_progress")));
    return Response.json({ ok: true, message: "照片已送达，等待认证" });
  }

  if (action === "review_task") {
    if (!senderOnly()) return fail("只有发送机能审核", 403);
    const taskId = text(body.taskId, 40);
    const decision = text(body.decision, 12);
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.pairId, member.pairId)))
      .limit(1);
    if (!task || task.status !== "pending_review") return fail("这份作业已经审过了");

    if (decision === "approve") {
      await db.transaction(async (tx) => {
        const [updated] = await tx
          .update(tasks)
          .set({ status: "completed", reviewedAt: new Date(), rejectReason: null })
          .where(and(eq(tasks.id, task.id), eq(tasks.status, "pending_review")))
          .returning({ id: tasks.id });
        if (updated) {
          await tx.insert(dropsLedger).values({ pairId: member.pairId, taskId: task.id, delta: 1, reason: "水位下降，认证成功" });
        }
      });
      return Response.json({ ok: true, message: "水位下降，认证成功 +1 💧" });
    }

    const reason = text(body.reason, 240);
    if (!reason) return fail("驳回时要告诉星人原因哦");
    if (task.finishDeadline && task.finishDeadline > new Date()) {
      await db
        .update(tasks)
        .set({ status: "in_progress", endPhotoUrl: null, submittedAt: null, rejectReason: reason })
        .where(and(eq(tasks.id, task.id), eq(tasks.status, "pending_review")));
      return Response.json({ ok: true, message: "已退回，星人还可以重拍" });
    }
    await applyFailure(task.id, member.pairId, `审核驳回：${reason}`);
    return Response.json({ ok: true, message: "剩余时间不足，任务已失败" });
  }

  if (action === "skip_task") {
    if (!starOnly()) return fail("只有星人能使用金牌", 403);
    const taskId = text(body.taskId, 40);
    if ((await medalBalance(member.pairId)) < 1) return fail("免死金牌库存不足");
    let skipped = false;
    try {
      await db.transaction(async (tx) => {
        const [updated] = await tx
          .update(tasks)
          .set({ status: "skipped", reviewedAt: new Date(), failReason: "使用免死金牌" })
          .where(and(eq(tasks.id, taskId), eq(tasks.pairId, member.pairId), eq(tasks.status, "in_progress")))
          .returning({ id: tasks.id });
        if (!updated) throw new Error("TASK_CHANGED");
        await tx.insert(medals).values({ pairId: member.pairId, taskId, delta: -1, reason: "跳过一杯水" });
      });
      skipped = true;
    } catch {
      skipped = false;
    }
    if (!skipped) return fail("这杯已经不能使用金牌");
    return Response.json({ ok: true, message: "金牌生效，这杯不算" });
  }

  if (action === "send_cheer") {
    if (!senderOnly()) return fail("只有发送机能发送鼓励", 403);
    const cheerText = text(body.text, 240);
    if (!cheerText) return fail("先写一句想说的话吧");
    await db.insert(cheers).values({ pairId: member.pairId, text: cheerText, emoji: text(body.emoji, 16) || "💕" });
    return Response.json({ ok: true, message: "鼓励已飞到星人身边" });
  }

  if (action === "grant_medal") {
    if (!senderOnly()) return fail("只有发送机能发金牌", 403);
    await db.insert(medals).values({ pairId: member.pairId, delta: 1, reason: text(body.reason, 160) || "发送机发放" });
    return Response.json({ ok: true, message: "免死金牌已送达 👑" });
  }

  if (action === "adjust_drops") {
    if (!senderOnly()) return fail("只有发送机能调整水滴", 403);
    let delta = Math.min(50, Math.max(-50, integer(body.delta)));
    if (!delta) return fail("调整数量不能是 0");
    const balance = await dropBalance(member.pairId);
    if (balance + delta < 0) delta = -balance;
    if (!delta) return fail("小水滴已经是 0 啦");
    await db.insert(dropsLedger).values({ pairId: member.pairId, delta, reason: text(body.reason, 200) || "发送机手动调整" });
    return Response.json({ ok: true, message: delta > 0 ? `奖励 ${delta} 朵小水滴` : `扣除 ${Math.abs(delta)} 朵小水滴` });
  }

  if (action === "add_reward") {
    if (!senderOnly()) return fail("只有发送机能管理奖品", 403);
    const title = text(body.title, 120);
    if (!title) return fail("给奖品起个名字吧");
    await db.insert(rewards).values({
      pairId: member.pairId,
      title,
      description: text(body.description, 240) || null,
      emoji: text(body.emoji, 16) || "🎁",
      cost: Math.min(999, Math.max(1, integer(body.cost, 20))),
    });
    return Response.json({ ok: true, message: "新奖品已上架" });
  }

  if (action === "toggle_reward") {
    if (!senderOnly()) return fail("只有发送机能管理奖品", 403);
    const [reward] = await db
      .select()
      .from(rewards)
      .where(and(eq(rewards.id, text(body.rewardId, 40)), eq(rewards.pairId, member.pairId)))
      .limit(1);
    if (!reward) return fail("没有找到这个奖品");
    await db.update(rewards).set({ active: !reward.active }).where(eq(rewards.id, reward.id));
    return Response.json({ ok: true });
  }

  if (action === "redeem_reward") {
    if (!starOnly()) return fail("只有星人能兑换", 403);
    const [reward] = await db
      .select()
      .from(rewards)
      .where(and(eq(rewards.id, text(body.rewardId, 40)), eq(rewards.pairId, member.pairId), eq(rewards.active, true)))
      .limit(1);
    if (!reward) return fail("这个奖品暂时下架了");
    if ((await dropBalance(member.pairId)) < reward.cost) return fail(`还差 ${reward.cost - (await dropBalance(member.pairId))} 朵小水滴`);
    const [pending] = await db
      .select({ id: redemptions.id })
      .from(redemptions)
      .where(and(eq(redemptions.pairId, member.pairId), eq(redemptions.rewardId, reward.id), eq(redemptions.status, "pending")))
      .limit(1);
    if (pending) return fail("这个奖品已经在等待确认啦");
    await db.insert(redemptions).values({ pairId: member.pairId, rewardId: reward.id, rewardTitle: reward.title, cost: reward.cost });
    return Response.json({ ok: true, message: "兑换申请已送达发送机" });
  }

  if (action === "handle_redemption") {
    if (!senderOnly()) return fail("只有发送机能确认兑换", 403);
    const redemptionId = text(body.redemptionId, 40);
    const decision = text(body.decision, 16);
    const [redemption] = await db
      .select()
      .from(redemptions)
      .where(and(eq(redemptions.id, redemptionId), eq(redemptions.pairId, member.pairId)))
      .limit(1);
    if (!redemption) return fail("没有找到这笔兑换");

    if (decision === "approve" && redemption.status === "pending") {
      if ((await dropBalance(member.pairId)) < redemption.cost) return fail("当前小水滴不足，暂时无法确认");
      await db.transaction(async (tx) => {
        const [updated] = await tx
          .update(redemptions)
          .set({ status: "approved", reviewedAt: new Date() })
          .where(and(eq(redemptions.id, redemption.id), eq(redemptions.status, "pending")))
          .returning({ id: redemptions.id });
        if (updated) {
          await tx.insert(dropsLedger).values({ pairId: member.pairId, delta: -redemption.cost, reason: `兑换：${redemption.rewardTitle}` });
        }
      });
      return Response.json({ ok: true, message: "兑换已确认，记得履行哦" });
    }
    if (decision === "reject" && redemption.status === "pending") {
      await db.update(redemptions).set({ status: "rejected", reviewedAt: new Date() }).where(eq(redemptions.id, redemption.id));
      return Response.json({ ok: true, message: "兑换已婉拒" });
    }
    if (decision === "done" && redemption.status === "approved") {
      await db.update(redemptions).set({ status: "done", reviewedAt: new Date() }).where(eq(redemptions.id, redemption.id));
      return Response.json({ ok: true, message: "奖品已履行，圆满收官" });
    }
    return fail("这笔兑换的状态已经变化");
  }

  if (action === "snapshot") {
    return Response.json(await getSnapshot(member));
  }

  return fail("未知操作", 404);
}
