"use client";

import { useEffect, useState } from "react";
import { StickerChip } from "@/components/Bits";
import {
  AWARD_STICKERS,
  DEDUCT_STICKERS,
  MAX_PER_ACTION,
  QUICK_REASONS_AWARD,
  QUICK_REASONS_DEDUCT,
  type StickerDef,
} from "@/lib/stickers";
import type { EntryKind } from "@/lib/types";

export type EntryDraft = {
  kind: EntryKind;
  amount: number;
  icon: string;
  reason: string;
};

export function StickerForm({
  kind,
  busy,
  onSubmit,
}: {
  kind: EntryKind;
  busy: boolean;
  onSubmit: (draft: EntryDraft) => Promise<void>;
}) {
  const isAward = kind === "award";
  const list: StickerDef[] = isAward ? AWARD_STICKERS : DEDUCT_STICKERS;
  const quick = isAward ? QUICK_REASONS_AWARD : QUICK_REASONS_DEDUCT;

  const [amount, setAmount] = useState(isAward ? 1 : 1);
  const [icon, setIcon] = useState(list[0].icon);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(0);

  useEffect(() => {
    setIcon((prev) => (list.some((s) => s.icon === prev) ? prev : list[0].icon));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const active = list.find((s) => s.icon === icon) ?? list[0];

  const submit = async () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("先写一句原因吧，账本要讲证据的");
      return;
    }
    setError(null);
    setFlash((n) => n + 1);
    await onSubmit({ kind, amount, icon, reason: trimmed });
    setReason("");
  };

  return (
    <div
      className="card relative flex flex-col gap-4 p-4 sm:p-5"
      style={{
        background: isAward ? "#fffbf3" : "#fbf6f0",
        borderColor: isAward ? "rgba(43,26,33,0.9)" : "rgba(43,26,33,0.9)",
      }}
    >
      <header className="flex items-center gap-3">
        <span
          className="sticker shrink-0"
          style={{ width: 42, height: 42, fontSize: 20 }}
        >
          {isAward ? "🎉" : "✂️"}
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-[21px] leading-tight">
            {isAward ? "奖励贴画" : "扣除贴画"}
          </h3>
          <p className="text-[12px] text-ink-3">
            {isAward
              ? "他表现好的时候，大方地贴上去"
              : "犯规了就撕几张下来，写清楚为什么"}
          </p>
        </div>
      </header>

      {/* 张数 */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[12.5px] font-medium text-ink-2">这次几张</span>
          <span className="num text-[12px] text-ink-3">最多 {MAX_PER_ACTION} 张</span>
        </div>
        <div className="flex items-center gap-2">
          {Array.from({ length: MAX_PER_ACTION }, (_, i) => i + 1).map((n) => {
            const on = n <= amount;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setAmount(n)}
                aria-label={`${n} 张`}
                className="btn-hard flex h-11 flex-1 items-center justify-center rounded-xl text-[15px] font-bold"
                style={{
                  background: on
                    ? isAward
                      ? "#e0455f"
                      : "#2f4b7c"
                    : "#fffaf1",
                  color: on ? "#fff8ee" : "#8a7280",
                }}
              >
                {on ? active.icon : n}
              </button>
            );
          })}
        </div>
      </div>

      {/* 贴纸选择 */}
      <div>
        <span className="mb-2 block text-[12.5px] font-medium text-ink-2">
          选一种贴纸
        </span>
        <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {list.map((s) => {
            const on = s.icon === icon;
            return (
              <button
                key={s.icon}
                type="button"
                onClick={() => setIcon(s.icon)}
                title={`${s.label} · ${s.hint}`}
                className="flex shrink-0 flex-col items-center gap-1"
              >
                <span
                  className="flex items-center justify-center rounded-2xl transition-all duration-200"
                  style={{
                    width: 50,
                    height: 50,
                    border: on
                      ? "2px solid rgba(43,26,33,0.9)"
                      : "2px solid rgba(43,26,33,0.14)",
                    background: on
                      ? isAward
                        ? "#ffe4e9"
                        : "#e2e8f2"
                      : "#fffaf1",
                    transform: on ? "translateY(-3px) scale(1.06)" : "none",
                    boxShadow: on ? "2px 3px 0 rgba(43,26,33,0.9)" : "none",
                  }}
                >
                  <span style={{ fontSize: 24 }}>{s.icon}</span>
                </span>
                <span
                  className="text-[10.5px]"
                  style={{ color: on ? "#2b1a21" : "#8a7280" }}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 原因 */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[12.5px] font-medium text-ink-2">
            原因<span className="text-berry"> *</span>
          </span>
          <span className="num text-[12px] text-ink-3">{reason.length}/120</span>
        </div>
        <textarea
          value={reason}
          maxLength={120}
          rows={2}
          onChange={(e) => {
            setReason(e.target.value);
            if (error) setError(null);
          }}
          placeholder={
            isAward ? "例如：主动洗了碗，还顺手拖了地" : "例如：说好十一点睡，又打到两点"
          }
          className="w-full resize-none rounded-xl border-2 border-ink/20 bg-[#fffaf1] px-3 py-2.5 text-[14px] leading-relaxed text-ink placeholder:text-ink-3/60"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {quick.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setReason(q)}
              className="rounded-full border border-ink/20 bg-paper-2/70 px-2.5 py-1 text-[11.5px] text-ink-2 transition-colors hover:border-ink/60 hover:bg-paper-3"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="rounded-lg bg-berry/10 px-3 py-2 text-[12.5px] text-berry-deep">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="btn-hard animate-sheen relative mt-auto flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 font-display text-[18px] tracking-wide"
        style={{
          background: isAward ? "#e0455f" : "#2f4b7c",
          color: "#fff8ee",
        }}
      >
        <StickerChip
          key={`${flash}-${icon}`}
          icon={active.icon}
          size={24}
          pop
          rotate={-8}
        />
        {busy
          ? "记账中…"
          : isAward
            ? `贴上 ${amount} 张`
            : `撕掉 ${amount} 张`}
      </button>
    </div>
  );
}
