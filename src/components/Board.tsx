"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Ambient,
  StickerRain,
  Toasts,
  type Burst,
  type Toast,
} from "@/components/Ambient";
import { Counter, Reveal, SectionTitle, StickerChip } from "@/components/Bits";
import { Ledger } from "@/components/Ledger";
import { StickerBook } from "@/components/StickerBook";
import { StickerForm, type EntryDraft } from "@/components/StickerForm";
import { WishWell } from "@/components/WishWell";
import { daysBetween, relativeTime } from "@/lib/format";
import type { AppState, EntryDTO, WishStatus } from "@/lib/types";

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || "网络开小差了，再试一次");
  return data;
}

export function Board({ initial }: { initial: AppState }) {
  const router = useRouter();
  const [state, setState] = useState<AppState>(initial);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [burst, setBurst] = useState<Burst | null>(null);
  const [busyKind, setBusyKind] = useState<"award" | "deduct" | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<null | "menu" | "settings">(null);
  const [syncing, setSyncing] = useState(false);
  const [draft, setDraft] = useState({
    herName: initial.couple.herName,
    hisName: initial.couple.hisName,
    wishCost: String(initial.couple.wishCost),
  });
  const busyRef = useRef(false);
  const toastId = useRef(0);
  const burstId = useRef(0);

  const { summary, entries, wishes, couple, me } = state;
  const isHer = me.role === "her";

  const pushToast = useCallback((text: string, tone: Toast["tone"] = "ok") => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev.slice(-2), { id, text, tone }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 2800);
  }, []);

  const fire = useCallback((icon: string, count: number, tone: Burst["tone"]) => {
    setBurst({ key: ++burstId.current, icon, count, tone });
  }, []);

  /** 统一提交：所有写接口都返回完整状态 */
  const commit = useCallback(
    async (url: string, init: RequestInit, okText?: string) => {
      busyRef.current = true;
      try {
        const next = await req<AppState>(url, init);
        setState(next);
        if (okText) pushToast(okText);
        return true;
      } catch (e) {
        pushToast(e instanceof Error ? e.message : "操作失败", "bad");
        return false;
      } finally {
        busyRef.current = false;
      }
    },
    [pushToast],
  );

  /* 双方数据共享：定时拉取对方的最新动作 */
  useEffect(() => {
    const tick = async () => {
      if (document.hidden || busyRef.current) return;
      try {
        setState(await req<AppState>("/api/state"));
      } catch {
        /* 静默失败，下次再试 */
      }
    };
    const t = setInterval(tick, 15000);
    return () => clearInterval(t);
  }, []);

  const sync = async () => {
    setSyncing(true);
    try {
      setState(await req<AppState>("/api/state"));
      pushToast("已同步最新账本");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "同步失败", "bad");
    } finally {
      setSyncing(false);
    }
  };

  /* ---------------- 操作 ---------------- */

  const createEntry = async (d: EntryDraft) => {
    setBusyKind(d.kind);
    const ok = await commit(
      "/api/stickers",
      { method: "POST", body: JSON.stringify(d) },
      d.kind === "award" ? `贴上去 ${d.amount} 张 ${d.icon}` : `撕掉了 ${d.amount} 张 ${d.icon}`,
    );
    if (ok) fire(d.icon, d.amount, d.kind);
    setBusyKind(null);
  };

  const undoEntry = async (id: string) => {
    setBusyId(id);
    await commit(`/api/stickers/${id}`, { method: "DELETE" }, "这一笔已经撤销");
    setBusyId(null);
  };

  const createWish = async (d: { title: string; detail: string }) => {
    const ok = await commit(
      "/api/wishes",
      { method: "POST", body: JSON.stringify(d) },
      `愿望记下啦：${d.title}`,
    );
    if (ok) fire("🌠", 5, "award");
    return ok;
  };

  const resolveWish = async (id: string, status: WishStatus, note?: string) => {
    setBusyId(id);
    const ok = await commit(
      `/api/wishes/${id}`,
      { method: "PATCH", body: JSON.stringify({ status, note }) },
      status === "granted"
        ? "答应啦，记得兑现哦"
        : status === "declined"
          ? "已驳回，贴画退回"
          : "已改回待兑现",
    );
    if (ok && status === "granted") fire("✅", 4, "award");
    setBusyId(null);
    return ok;
  };

  const deleteWish = async (id: string) => {
    setBusyId(id);
    const ok = await commit(
      `/api/wishes/${id}`,
      { method: "DELETE" },
      "愿望已删除，贴画退回账户",
    );
    setBusyId(null);
    return ok;
  };

  const saveSettings = async () => {
    const ok = await commit(
      "/api/settings",
      {
        method: "PUT",
        body: JSON.stringify({ ...draft, wishCost: Number(draft.wishCost) }),
      },
      "设置已保存",
    );
    if (ok) setSheet(null);
  };

  const logout = async () => {
    await fetch("/api/couple", { method: "DELETE" });
    router.refresh();
  };

  const copyInvite = async () => {
    const link = `${window.location.origin}/?c=${couple.code}`;
    try {
      await navigator.clipboard.writeText(link);
      pushToast("邀请链接已复制，发给他就行");
    } catch {
      pushToast(`复制链接失败，邀请码是 ${couple.code}`, "bad");
    }
  };

  const copyOwnerKey = async () => {
    if (!couple.ownerKey) return;
    try {
      await navigator.clipboard.writeText(couple.ownerKey);
      pushToast("登录码已复制，自己留着别外传", "ok");
    } catch {
      pushToast(`你的登录码是 ${couple.ownerKey}`, "bad");
    }
  };

  /* ---------------- 派生 ---------------- */

  const wall = useMemo(() => {
    const out: Array<{ id: string; entry: EntryDTO }> = [];
    for (const e of entries) {
      for (let i = 0; i < e.amount; i++) {
        out.push({ id: `${e.id}-${i}`, entry: e });
        if (out.length >= 34) return out;
      }
    }
    return out;
  }, [entries]);

  const iconPool = useMemo(() => {
    const seen: string[] = [];
    for (const e of entries) {
      if (e.kind === "award" && !seen.includes(e.icon)) seen.push(e.icon);
      if (seen.length >= 20) break;
    }
    return seen;
  }, [entries]);

  const oldest = entries.length ? entries[entries.length - 1].createdAt : null;
  const spanDays = oldest ? daysBetween(oldest, new Date().toISOString()) : 0;

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const stats = [
    { label: "累计奖励", value: summary.awarded, unit: "张", color: "#a92a44", icon: "/hellokitty/17.jpg" },
    { label: "累计扣除", value: summary.deducted, unit: "张", color: "#2f4b7c", icon: "/hellokitty/16.jpg" },
    { label: "本周奖励", value: summary.weekAwarded, unit: "张", color: "#2f7a6b", icon: "/hellokitty/20.jpg" },
    { label: "兑现愿望", value: summary.grantedWishes, unit: "个", color: "#8a5a12", icon: "/hellokitty/4.jpg" },
  ];

  const dock = isHer
    ? [
        { id: "desk", label: "发贴画", icon: "/hellokitty/19.jpg" },
        { id: "ledger", label: "账本", icon: "/hellokitty/6.jpg" },
        { id: "wish", label: "许愿池", icon: "/hellokitty/8.jpg" },
        { id: "__menu", label: "更多", icon: "/hellokitty/5.png" },
      ]
    : [
        { id: "__top", label: "首页", icon: "/hellokitty/19.jpg" },
        { id: "ledger", label: "账本", icon: "/hellokitty/6.jpg" },
        { id: "wish", label: "许愿", icon: "/hellokitty/8.jpg" },
        { id: "__menu", label: "更多", icon: "/hellokitty/5.png" },
      ];

  return (
    <div className="relative min-h-dvh pb-24 sm:pb-10">
      <Ambient />
      <StickerRain burst={burst} />
      <Toasts items={toasts} />

      {/* 顶栏 */}
      <header className="sticky top-0 z-40 border-b-2 border-ink/90 bg-paper/92 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1180px] items-center gap-2.5 px-4 py-2.5 sm:px-6">
          <span
            className="sticker animate-wobble overflow-hidden bg-white"
            style={{ width: 34, height: 34 }}
          >
            <img
              src="/hellokitty/9.png"
              alt="Hello Kitty"
              width={34}
              height={34}
              className="h-full w-full object-cover"
            />
          </span>
          <div className="min-w-0 leading-tight">
            <h1 className="font-display text-[18px] text-ink sm:text-[21px]">贴画铺子</h1>
            <p className="truncate text-[11px] text-ink-3">
              {couple.herName} 和 {couple.hisName} 的账本
            </p>
          </div>
          <span
            className="ml-auto hidden shrink-0 rounded-full border-2 border-ink/85 px-2.5 py-1 text-[11.5px] font-medium sm:inline"
            style={{
              background: isHer ? "#ffe4e9" : "#e2e8f2",
              color: isHer ? "#a92a44" : "#2f4b7c",
            }}
          >
            {isHer ? "管理员 · 她" : "攒贴画的 · 他"}
          </span>
          <button
            type="button"
            onClick={sync}
            className="btn-hard rounded-xl bg-[#fffaf1] px-2.5 py-1.5 text-[13px]"
            aria-label="同步最新账本"
          >
            <span className={syncing ? "inline-block animate-spin" : "inline-block"}>↻</span>
          </button>
          <button
            type="button"
            onClick={() => setSheet("menu")}
            className="btn-hard rounded-xl bg-[#fffaf1] px-3 py-1.5 text-[13px] font-medium"
          >
            {isHer ? "邀请 / 设置" : "我的"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-4 sm:px-6">
        {/* 英雄区 */}
        <section className="grid grid-cols-2 gap-4 py-7 sm:gap-6 sm:py-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center">
          <div className="min-w-0">
            <Reveal>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink/85 bg-[#fffaf1] px-3 py-1 text-[12px] font-medium text-ink-2">
                  <span className="h-2 w-2 animate-ping rounded-full bg-berry" />
                  第 {spanDays || 1} 天 · {isHer ? "管理员" : "攒贴画中"}
                </span>
                <span
                  className="rounded-full px-2.5 py-1 text-[11.5px] font-medium sm:hidden"
                  style={{
                    background: isHer ? "#ffe4e9" : "#e2e8f2",
                    color: isHer ? "#a92a44" : "#2f4b7c",
                  }}
                >
                  {isHer ? "她 · 可发可扣" : "他 · 只能许愿"}
                </span>
              </div>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="mt-4 font-display text-[34px] leading-[1.06] text-ink sm:text-[52px]">
                {couple.hisName}现在
                <br className="sm:hidden" />
                还有
                <span className="mx-2 inline-block">
                  <Counter
                    value={summary.available}
                    className="text-[58px] leading-none text-berry sm:text-[86px]"
                  />
                </span>
                <span className="text-[26px] sm:text-[38px]">张贴画</span>
              </h2>
            </Reveal>
            <Reveal delay={150}>
              <p className="mt-4 max-w-[30rem] text-[14px] leading-relaxed text-ink-2 sm:text-[15px]">
                {isHer ? (
                  <>
                    表现好就贴一张，犯规了就撕一张，一次最多五张，
                    <strong className="text-ink">每一笔都要写原因和时间</strong>。
                  </>
                ) : (
                  <>
                    她贴的每一张都记在这本账上，原因写得清清楚楚。
                    <strong className="text-ink">攒够就能理直气壮地许愿</strong>。
                  </>
                )}
              </p>
            </Reveal>
            <Reveal delay={210}>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {isHer ? (
                  <button
                    type="button"
                    onClick={() => scrollTo("desk")}
                    className="btn-hard animate-sheen relative overflow-hidden rounded-xl bg-berry px-5 py-3 font-display text-[17px] text-[#fff8ee]"
                  >
                    去发贴画
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => scrollTo("wish")}
                    className="btn-hard animate-sheen relative overflow-hidden rounded-xl bg-gold px-5 py-3 font-display text-[17px] text-ink"
                  >
                    我要许愿
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => scrollTo("ledger")}
                  className="btn-hard rounded-xl bg-[#fffaf1] px-5 py-3 font-display text-[17px] text-ink"
                >
                  翻账本
                </button>

              </div>
            </Reveal>
          </div>

          <Reveal delay={120} className="min-w-0">
            {/* 移动端右侧:Hello Kitty 装饰图 */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-ink/85 bg-white/60 lg:hidden">
              <img
                src="/hellokitty/10.jpg"
                alt="Hello Kitty"
                width={520}
                height={320}
                className="block h-auto w-full object-cover"
              />
            </div>
            {/* 桌面端:许愿进度 */}
            <div className="hidden lg:block">
              <StickerBook
                available={summary.available}
                wishCost={summary.wishCost}
                icons={iconPool}
              />
            </div>
          </Reveal>
        </section>

        {/* 邀请卡 */}
        {isHer && !couple.hasPartner ? (
          <Reveal>
            <section className="pb-2">
              <div
                className="card relative overflow-hidden p-4 sm:p-5"
                style={{ background: "linear-gradient(135deg,#fff3d8,#ffe4e9)" }}
              >
                <div className="flex flex-wrap items-center gap-4">
                  <span className="sticker animate-floaty" style={{ width: 52, height: 52, fontSize: 26, ["--d" as string]: "6s" }}>
                    🔑
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-[20px] text-ink">把他拉进来</h3>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-2">
                      他用这个邀请码加入后，你们看到的是同一本账。
                      他只能许愿，发贴画的权限只在你手上。
                      {couple.ownerKey ? (
                        <>
                          <br />
                          你自己换设备请用设置里的
                          <strong className="text-berry">登录码 {couple.ownerKey}</strong>。
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="num rounded-xl border-2 border-ink/85 bg-[#fffaf1] px-4 py-2 text-[26px] font-bold tracking-[0.3em] text-ink">
                      {couple.code}
                    </div>
                    <button
                      type="button"
                      onClick={copyInvite}
                      className="btn-hard mt-2 w-full rounded-lg bg-ink px-3 py-1.5 text-[12.5px] text-paper"
                    >
                      复制邀请链接
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </Reveal>
        ) : null}

        {/* 数据条 */}
        <section className="grid grid-cols-2 gap-3 pt-5 sm:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 70}>
              <div className="card-soft flex items-center gap-3 p-3.5">
                <span className="sticker shrink-0 overflow-hidden bg-white/60" style={{ width: 36, height: 36 }}>
                  <img
                    src={s.icon}
                    alt={s.label}
                    width={36}
                    height={36}
                    className="h-full w-full object-cover"
                  />
                </span>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1">
                    <Counter value={s.value} className="text-[26px] font-bold leading-none" />
                    <span className="text-[11.5px] text-ink-3">{s.unit}</span>
                  </div>
                  <p className="mt-0.5 text-[12px] text-ink-2">{s.label}</p>
                </div>
                <span className="ml-auto h-8 w-[4px] rounded-full" style={{ background: s.color }} />
              </div>
            </Reveal>
          ))}
        </section>

        {/* 操作台 */}
        <section id="desk" className="scroll-mt-24 pt-10 sm:pt-14">
          <SectionTitle
            index="01"
            title="操作台"
            desc={
              isHer
                ? "一次最多 5 张，原因必填 —— 这是我们的规矩"
                : "这里是她的地盘，你负责乖乖表现"
            }
          />
          {isHer ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <Reveal>
                <StickerForm kind="award" busy={busyKind === "award"} onSubmit={createEntry} />
              </Reveal>
              <Reveal delay={90}>
                <StickerForm kind="deduct" busy={busyKind === "deduct"} onSubmit={createEntry} />
              </Reveal>
            </div>
          ) : (
            <Reveal>
              <div className="card flex items-center gap-4 p-5" style={{ background: "#fbf6f0" }}>
                <span className="sticker shrink-0" style={{ width: 54, height: 54, fontSize: 26 }}>
                  🔒
                </span>
                <div>
                  <h3 className="font-display text-[19px] text-ink">发贴画的权限在 {couple.herName} 手上</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
                    你能看到每一笔奖励和扣除，也能在攒够 {summary.wishCost} 张之后许愿。
                    想要贴画？去做点让她开心的事吧。
                  </p>
                </div>
              </div>
            </Reveal>
          )}
        </section>

        {/* 贴画墙 */}
        <section className="pt-10 sm:pt-14">
          <SectionTitle
            index="02"
            title="贴画墙"
            desc="最近的战利品都钉在这儿，点一下能看到原因"
            accent="#d99a2b"
          />
          <Reveal>
            <div className="card relative overflow-hidden p-4 sm:p-6">
              <div
                aria-hidden
                className="absolute left-1/2 top-[-10px] h-6 w-28 rounded-sm bg-berry/60"
                style={{ transform: "translateX(-50%) rotate(-2deg)" }}
              />
              {wall.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="mb-1 text-[36px]">🫙</div>
                  <p className="font-display text-[18px] text-ink">墙上还空空的</p>
                  <p className="mt-1 text-[13px] text-ink-3">
                    {isHer ? "发出第一张贴画，这里就会热闹起来。" : "等她发出第一张贴画，这里就会热闹起来。"}
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5 pt-2 sm:gap-3">
                  {wall.map((w, i) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() =>
                        pushToast(
                          `${w.entry.label} ${w.entry.kind === "award" ? "+" : "−"}${w.entry.amount} · ${w.entry.reason}`,
                          w.entry.kind === "award" ? "ok" : "bad",
                        )
                      }
                      className="transition-transform duration-200 hover:-translate-y-1.5 hover:scale-110"
                      title={`${w.entry.label} · ${w.entry.reason}`}
                    >
                      <StickerChip
                        icon={w.entry.icon}
                        size={46}
                        rotate={((i * 53) % 25) - 12}
                        cut={i % 3 === 0}
                        pop
                        delay={Math.min(i, 20) * 30}
                        dim={w.entry.kind === "deduct"}
                      />
                    </button>
                  ))}
                </div>
              )}
              {entries.length ? (
                <p className="mt-4 border-t-2 border-dashed border-ink/15 pt-3 text-[12px] text-ink-3">
                  最近一次记账：{relativeTime(entries[0].createdAt)} · {entries[0].label}{" "}
                  {entries[0].kind === "award" ? "+" : "−"}
                  {entries[0].amount}
                </p>
              ) : null}
            </div>
          </Reveal>
        </section>

        {/* 账本 */}
        <section id="ledger" className="scroll-mt-24 pt-10 sm:pt-14">
          <SectionTitle
            index="03"
            title="流水账本"
            desc="时间、原因、张数，一笔都赖不掉"
            accent="#2f4b7c"
          />
          <Ledger entries={entries} onUndo={undoEntry} busyId={busyId} canUndo={isHer} />
        </section>

        {/* 许愿池 */}
        <section id="wish" className="scroll-mt-24 pt-10 pb-4 sm:pt-14">
          <SectionTitle
            index="04"
            title="许愿池"
            desc={`${summary.wishCost} 张贴画 = 1 个愿望，兑现由 ${couple.herName} 拍板`}
            accent="#2f7a6b"
          />
          <WishWell
            summary={summary}
            wishes={wishes}
            herName={couple.herName}
            hisName={couple.hisName}
            role={me.role}
            onCreate={createWish}
            onResolve={resolveWish}
            onDelete={deleteWish}
          />
        </section>

        {/* 公约 */}
        <footer className="mt-12 border-t-2 border-dashed border-ink/20 pt-8">
          <div className="card-soft p-5">
            <h3 className="font-display text-[20px] text-ink">我们的贴画公约</h3>
            <ol className="mt-3 space-y-2 text-[13.5px] leading-relaxed text-ink-2">
              {[
                `贴画由 ${couple.herName} 发放和扣除，${couple.hisName} 负责攒和许愿。`,
                "一次最多贴 5 张，再多就是通货膨胀了。",
                "每一笔都必须写原因，不写原因的一律无效。",
                "扣除同样要讲道理，不能只因为心情不好。",
                `攒满 ${summary.wishCost} 张可以许一个愿望，愿望要具体、可执行。`,
                "愿望被驳回，贴画原路退回，不许闹脾气。",
              ].map((line, i) => (
                <li key={line} className="flex gap-2.5">
                  <span className="num mt-[2px] shrink-0 text-berry">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>
          </div>
          <p className="py-8 text-center text-[12px] text-ink-3">
            贴画铺子 · 只属于 {couple.herName} 和 {couple.hisName} 的小账本
          </p>
        </footer>
      </main>

      {/* 移动端 Dock */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink/90 bg-paper/95 backdrop-blur sm:hidden">
        <div className="grid grid-cols-4">
          {dock.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === "__menu") return setSheet("menu");
                if (item.id === "__top") return window.scrollTo({ top: 0, behavior: "smooth" });
                scrollTo(item.id);
              }}
              className="flex flex-col items-center gap-1 py-2 text-[11px] text-ink-2 active:bg-paper-2"
            >
              <span
                className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/70"
                style={{ width: 28, height: 28 }}
              >
                <img
                  src={item.icon}
                  alt={item.label}
                  width={28}
                  height={28}
                  className="h-full w-full object-cover"
                />
              </span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* 菜单 / 设置 */}
      {sheet ? (
        <div
          className="fixed inset-0 z-[65] flex items-end justify-center bg-ink/45 sm:items-center sm:p-6"
          onClick={() => setSheet(null)}
        >
          <div
            className="card w-full max-w-[440px] rounded-b-none p-5 sm:rounded-b-[22px]"
            onClick={(e) => e.stopPropagation()}
          >
            {sheet === "menu" ? (
              <>
                <h3 className="font-display text-[21px] text-ink">
                  {isHer ? "邀请与设置" : "我的"}
                </h3>
                <p className="mt-1 text-[12.5px] text-ink-3">
                  当前身份：{isHer ? `${couple.herName}（管理员）` : `${me.nickname}（攒贴画的）`}
                  {isHer ? (couple.hasPartner ? " · 他已加入" : " · 他还没加入") : ""}
                </p>

                {isHer ? (
                  <>
                    <div className="mt-4 rounded-xl border-2 border-dashed border-ink/25 bg-paper-2/50 p-3.5 text-center">
                      <p className="text-[12px] text-ink-3">给他的邀请码</p>
                      <p className="num my-1 text-[30px] font-bold tracking-[0.3em] text-ink">
                        {couple.code}
                      </p>
                      <button
                        type="button"
                        onClick={copyInvite}
                        className="btn-hard w-full rounded-lg bg-ink py-2 text-[13px] text-paper"
                      >
                        复制邀请链接
                      </button>
                    </div>

                    {couple.ownerKey ? (
                      <div className="mt-3 rounded-xl border-2 border-berry/35 bg-berry/5 p-3.5 text-center">
                        <p className="text-[12px] font-medium text-berry-deep">
                          🔐 你的登录码（换手机 / 平板用）
                        </p>
                        <p className="num my-1 text-[30px] font-bold tracking-[0.3em] text-berry-deep">
                          {couple.ownerKey}
                        </p>
                        <button
                          type="button"
                          onClick={copyOwnerKey}
                          className="btn-hard w-full rounded-lg bg-berry py-2 text-[13px] text-[#fff8ee]"
                        >
                          复制登录码
                        </button>
                        <p className="mt-2 text-[11.5px] leading-relaxed text-ink-3">
                          在新设备上选「用邀请码」，输入这个码，身份还是管理员。
                          <strong className="text-berry-deep">别发给他</strong>，
                          否则他也能发贴画了。
                        </p>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="mt-4 rounded-xl border-2 border-dashed border-ink/25 bg-paper-2/50 p-3.5 text-[13px] leading-relaxed text-ink-2">
                    你的权限：查看账本、查看贴画墙、攒够 {summary.wishCost} 张后许愿。
                    发贴画、扣贴画、处理愿望都由 {couple.herName} 操作。
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-2">
                  {isHer ? (
                    <button
                      type="button"
                      onClick={() => {
                        setDraft({
                          herName: couple.herName,
                          hisName: couple.hisName,
                          wishCost: String(couple.wishCost),
                        });
                        setSheet("settings");
                      }}
                      className="btn-hard rounded-xl bg-[#fffaf1] py-3 font-display text-[16px] text-ink"
                    >
                      账本设置
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={logout}
                    className="rounded-xl border-2 border-berry/50 py-2.5 text-[13px] text-berry-deep"
                  >
                    退出登录（数据保留）
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheet(null)}
                    className="py-2 text-[13px] text-ink-3"
                  >
                    关闭
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-display text-[21px] text-ink">账本设置</h3>
                <div className="mt-4 space-y-3">
                  <label className="block">
                    <span className="text-[12.5px] font-medium text-ink-2">她的昵称</span>
                    <input
                      value={draft.herName}
                      maxLength={12}
                      onChange={(e) => setDraft((d) => ({ ...d, herName: e.target.value }))}
                      className="mt-1 w-full rounded-xl border-2 border-ink/20 bg-[#fffaf1] px-3 py-2.5 text-[14px]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[12.5px] font-medium text-ink-2">他的昵称</span>
                    <input
                      value={draft.hisName}
                      maxLength={12}
                      onChange={(e) => setDraft((d) => ({ ...d, hisName: e.target.value }))}
                      className="mt-1 w-full rounded-xl border-2 border-ink/20 bg-[#fffaf1] px-3 py-2.5 text-[14px]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[12.5px] font-medium text-ink-2">许愿门槛</span>
                    <input
                      value={draft.wishCost}
                      inputMode="numeric"
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, wishCost: e.target.value.replace(/\D/g, "") }))
                      }
                      className="num mt-1 w-full rounded-xl border-2 border-ink/20 bg-[#fffaf1] px-3 py-2.5 text-[14px]"
                    />
                  </label>
                </div>
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={saveSettings}
                    className="btn-hard flex-1 rounded-xl bg-berry py-3 font-display text-[17px] text-[#fff8ee]"
                  >
                    保存
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheet("menu")}
                    className="rounded-xl border-2 border-ink/25 px-4 py-3 text-[14px] text-ink-2"
                  >
                    返回
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between border-t-2 border-dashed border-ink/15 pt-3">
                  <span className="text-[11.5px] text-ink-3">危险区：清空所有贴画与愿望</span>
                  <button
                    type="button"
                    onClick={() => commit("/api/reset", { method: "DELETE" }, "账本已清空")}
                    className="rounded-lg border-2 border-berry/60 px-2.5 py-1 text-[11.5px] text-berry-deep"
                  >
                    清空账本
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
