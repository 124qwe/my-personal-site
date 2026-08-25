"use client";

import { useState } from "react";
import { Reveal } from "@/components/Bits";
import { relativeTime } from "@/lib/format";
import { WISH_IDEAS, WISH_STATUS_LABEL } from "@/lib/stickers";
import type { Role, Summary, WishDTO, WishStatus } from "@/lib/types";

const STATUS_STYLE: Record<WishStatus, { bg: string; color: string; dot: string }> = {
  open: { bg: "#ffe9c9", color: "#8a5a12", dot: "#d99a2b" },
  granted: { bg: "#d9efe6", color: "#1c5a4c", dot: "#2f7a6b" },
  declined: { bg: "#e9e3e6", color: "#6b5a63", dot: "#8a7280" },
};

export function WishWell({
  summary,
  wishes,
  herName,
  hisName,
  role,
  onCreate,
  onResolve,
  onDelete,
}: {
  summary: Summary;
  wishes: WishDTO[];
  herName: string;
  hisName: string;
  role: Role;
  onCreate: (draft: { title: string; detail: string }) => Promise<boolean>;
  onResolve: (id: string, status: WishStatus, note?: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const canCreate = role === "his";
  const canResolve = role === "her";

  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busyCard, setBusyCard] = useState<string | null>(null);

  const lack = Math.max(0, summary.wishCost - summary.available);
  const pct = Math.min(
    100,
    Math.round((summary.available / summary.wishCost) * 100),
  );

  const submitWish = async () => {
    if (!title.trim()) {
      setError("先写下你想要什么呀");
      return;
    }
    setError(null);
    setBusy(true);
    const ok = await onCreate({ title: title.trim(), detail: detail.trim() });
    setBusy(false);
    if (ok) {
      setTitle("");
      setDetail("");
    }
  };

  const confirmResolve = async (id: string, status: WishStatus) => {
    setBusyCard(id);
    const ok = await onResolve(id, status, note.trim() || undefined);
    setBusyCard(null);
    if (ok) {
      setResolvingId(null);
      setNote("");
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* 许愿台 */}
      <div className="card relative overflow-hidden p-4 sm:p-5">
        <div
          aria-hidden
          className="absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-25"
          style={{ background: "radial-gradient(circle,#d99a2b,transparent 70%)" }}
        />
        <div className="mb-3 flex items-center gap-2">
          <span className="sticker overflow-hidden bg-white/70" style={{ width: 40, height: 40 }}>
            <img
              src="/hellokitty/14.jpg"
              alt="许愿池"
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          </span>
          <div>
            <h3 className="font-display text-[21px] leading-tight">许愿池</h3>
            <p className="text-[12px] text-ink-3">
              {summary.wishCost} 张贴画换 1 个愿望，{canCreate ? `${herName}说了算` : `${hisName}来许`}
            </p>
          </div>
        </div>

        <div className="mb-1 flex items-baseline justify-between text-[12.5px] text-ink-2">
          <span>
            现在可用{" "}
            <strong className="num text-[16px] text-berry">{summary.available}</strong> 张
          </span>
          <span className="num text-ink-3">门槛 {summary.wishCost} 张</span>
        </div>
        <div className="h-[10px] w-full overflow-hidden rounded-full border-2 border-ink/85 bg-paper-2">
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out"
            style={{
              width: `${pct}%`,
              background: summary.canWish
                ? "linear-gradient(90deg,#d99a2b,#e0455f)"
                : "linear-gradient(90deg,#2f7a6b,#5aa08d)",
            }}
          />
        </div>

        {canCreate && summary.canWish ? (
          <div className="mt-4 space-y-3">
            <div className="animate-ring rounded-xl bg-berry/10 px-3 py-2 text-[13px] font-medium text-berry-deep">
              够啦！{hisName}可以许愿了 🎊
            </div>
            <input
              value={title}
              maxLength={40}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder="我的愿望是……"
              className="w-full rounded-xl border-2 border-ink/20 bg-[#fffaf1] px-3 py-2.5 text-[14px] text-ink placeholder:text-ink-3/60"
            />
            <textarea
              value={detail}
              maxLength={200}
              rows={2}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="补充说明（可选）：什么时候兑现、有什么条件"
              className="w-full resize-none rounded-xl border-2 border-ink/20 bg-[#fffaf1] px-3 py-2.5 text-[13.5px] leading-relaxed text-ink placeholder:text-ink-3/60"
            />
            <div className="flex flex-wrap gap-1.5">
              {WISH_IDEAS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setTitle(w)}
                  className="rounded-full border border-ink/20 bg-paper-2/70 px-2.5 py-1 text-[11.5px] text-ink-2 transition-colors hover:border-ink/60 hover:bg-paper-3"
                >
                  {w}
                </button>
              ))}
            </div>
            {error ? <p className="text-[12.5px] text-berry-deep">{error}</p> : null}
            <button
              type="button"
              disabled={busy}
              onClick={submitWish}
              className="btn-hard animate-sheen relative w-full overflow-hidden rounded-xl bg-gold py-3.5 font-display text-[18px] text-[#2b1a21]"
            >
              {busy ? "许愿中…" : `花 ${summary.wishCost} 张 · 许一个愿望`}
            </button>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border-2 border-dashed border-ink/25 bg-paper-2/40 px-4 py-6 text-center">
            <div className="mb-1 text-[30px]">
              {canCreate ? "🔒" : "🗝️"}
            </div>
            {canCreate ? (
              <>
                <p className="font-display text-[17px] text-ink">许愿池还没开</p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
                  还差 <strong className="num text-[17px] text-berry">{lack}</strong>{" "}
                  张贴画，先好好表现吧 {hisName}。
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-[17px] text-ink">愿望由 {hisName} 来许</p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
                  {summary.canWish
                    ? `他现在已经攒够了，正在挑愿望。你要做的是决定兑不兑现。`
                    : `他还差 ${lack} 张才能许愿，继续发贴画或者……继续扣。`}
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* 愿望墙 */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <h3 className="font-display text-[19px] text-ink">愿望墙</h3>
          <span className="num rounded-full bg-ink px-2 py-0.5 text-[11.5px] text-paper">
            {wishes.length}
          </span>
          <span className="ml-auto text-[12px] text-ink-3">
            待兑现 {summary.openWishes} · 已兑现 {summary.grantedWishes}
          </span>
        </div>

        {wishes.length === 0 ? (
          <div className="card-soft px-5 py-10 text-center">
            <div className="mb-1 text-[32px]">🫧</div>
            <p className="text-[13.5px] text-ink-2">
              还没有愿望。攒够 {summary.wishCost} 张贴画，第一个愿望由 {hisName} 来写。
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {wishes.map((w, i) => {
              const s = STATUS_STYLE[w.status];
              const busyHere = busyCard === w.id;
              const canDeleteThis = canResolve || (w.ownerRole === "his" && w.status === "open");
              return (
                <Reveal as="li" key={w.id} delay={Math.min(i, 6) * 50}>
                  <article className="card-soft p-3.5">
                    <div className="flex items-start gap-2">
                      <span className="mt-1 text-[18px]">
                        {w.status === "granted" ? "✅" : w.status === "declined" ? "🫥" : "🌠"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-display text-[16.5px] text-ink">{w.title}</h4>
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                            style={{ background: s.bg, color: s.color }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ background: s.dot }}
                            />
                            {WISH_STATUS_LABEL[w.status]}
                          </span>
                          <span className="num ml-auto text-[12px] text-ink-3">−{w.cost} 张</span>
                        </div>
                        {w.detail ? (
                          <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{w.detail}</p>
                        ) : null}
                        {w.note ? (
                          <p className="mt-1.5 rounded-lg bg-paper-2/70 px-2.5 py-1.5 text-[12.5px] text-ink-2">
                            <span className="font-medium text-ink">{herName}批注：</span>
                            {w.note}
                          </p>
                        ) : null}
                        <p className="num mt-1.5 text-[11.5px] text-ink-3">
                          许于 {relativeTime(w.createdAt)}
                          {w.resolvedAt ? ` · 处理于 ${relativeTime(w.resolvedAt)}` : ""}
                        </p>
                      </div>
                    </div>

                    {resolvingId === w.id && canResolve ? (
                      <div className="mt-3 space-y-2 border-t-2 border-dashed border-ink/15 pt-3">
                        <input
                          value={note}
                          maxLength={120}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="写句批注，例如：周六兑现，不许熬夜"
                          className="w-full rounded-lg border-2 border-ink/20 bg-[#fffaf1] px-3 py-2 text-[13px] text-ink placeholder:text-ink-3/60"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={busyHere}
                            onClick={() => confirmResolve(w.id, "granted")}
                            className="btn-hard rounded-lg bg-moss px-3 py-1.5 text-[12.5px] font-bold text-[#fff8ee]"
                          >
                            答应并兑现
                          </button>
                          <button
                            type="button"
                            disabled={busyHere}
                            onClick={() => confirmResolve(w.id, "declined")}
                            className="btn-hard rounded-lg bg-[#8a7280] px-3 py-1.5 text-[12.5px] font-bold text-[#fff8ee]"
                          >
                            这个不行
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setResolvingId(null);
                              setNote("");
                            }}
                            className="px-2 py-1.5 text-[12.5px] text-ink-3"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        {canResolve && w.status !== "granted" ? (
                          <button
                            type="button"
                            onClick={() => {
                              setResolvingId(w.id);
                              setNote("");
                            }}
                            className="rounded-lg border-2 border-ink/85 bg-moss px-3 py-1 text-[12.5px] font-bold text-[#fff8ee] transition-transform hover:-translate-y-[1px]"
                          >
                            处理这个愿望
                          </button>
                        ) : null}
                        {canResolve && w.status === "granted" ? (
                          <button
                            type="button"
                            disabled={busyHere}
                            onClick={() => onResolve(w.id, "open")}
                            className="rounded-lg border-2 border-ink/25 px-3 py-1 text-[12.5px] text-ink-2"
                          >
                            改回待兑现
                          </button>
                        ) : null}
                        {!canResolve ? (
                          <span className="text-[12px] text-ink-3">
                            {w.status === "open"
                              ? `等 ${herName} 拍板…`
                              : `${herName} 已经处理过了`}
                          </span>
                        ) : null}
                        {canDeleteThis ? (
                          <button
                            type="button"
                            disabled={busyHere}
                            onClick={() => onDelete(w.id)}
                            className="ml-auto rounded-lg px-2.5 py-1 text-[12px] text-ink-3 underline decoration-dotted underline-offset-4 hover:text-berry"
                          >
                            {canResolve ? `删除（退回 ${w.cost} 张）` : "撤回这个愿望"}
                          </button>
                        ) : null}
                      </div>
                    )}
                  </article>
                </Reveal>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
