"use client";

import { useMemo, useState } from "react";
import { Reveal, StickerChip } from "@/components/Bits";
import { dayKey, formatClock, formatDayLabel } from "@/lib/format";
import type { EntryDTO, EntryKind } from "@/lib/types";

type Filter = "all" | EntryKind;

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: "all", label: "全部" },
  { key: "award", label: "奖励" },
  { key: "deduct", label: "扣除" },
];

export function Ledger({
  entries,
  onUndo,
  busyId,
  canUndo = true,
}: {
  entries: EntryDTO[];
  onUndo: (id: string) => void;
  busyId: string | null;
  canUndo?: boolean;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const groups = useMemo(() => {
    const q = query.trim();
    const list = entries.filter((e) => {
      if (filter !== "all" && e.kind !== filter) return false;
      if (!q) return true;
      return (
        e.reason.toLowerCase().includes(q.toLowerCase()) ||
        e.label.toLowerCase().includes(q.toLowerCase())
      );
    });
    const map = new Map<string, EntryDTO[]>();
    list.forEach((e) => {
      const k = dayKey(e.createdAt);
      const arr = map.get(k);
      if (arr) arr.push(e);
      else map.set(k, [e]);
    });
    return Array.from(map.entries());
  }, [entries, filter, query]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-full border-2 border-ink/85 bg-[#fffaf1] p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className="rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all duration-200"
              style={{
                background: filter === f.key ? "#2b1a21" : "transparent",
                color: filter === f.key ? "#fdf3e4" : "#55404a",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜原因…"
          className="min-w-[130px] flex-1 rounded-full border-2 border-ink/20 bg-[#fffaf1] px-3.5 py-1.5 text-[13px] text-ink placeholder:text-ink-3/60"
        />
        <span className="num text-[12.5px] text-ink-3">
          共 {groups.reduce((n, g) => n + g[1].length, 0)} 笔
        </span>
      </div>

      {groups.length === 0 ? (
        <div className="card-soft flex flex-col items-center gap-2 px-6 py-14 text-center">
          <span className="text-[38px]">🗒️</span>
          <p className="font-display text-[18px] text-ink">账本还是空的</p>
          <p className="max-w-[280px] text-[13px] leading-relaxed text-ink-3">
            每一次奖励和扣除都会写在这里，原因和时间一个都跑不掉。
          </p>
        </div>
      ) : null}

      <div className="space-y-6">
        {groups.map(([key, items], gi) => (
          <div key={key}>
            <div className="mb-2 flex items-center gap-3">
              <span className="font-display text-[15px] text-ink-2">
                {formatDayLabel(items[0].createdAt)}
              </span>
              <span className="h-px flex-1 bg-ink/15" />
              <span className="num text-[12px] text-ink-3">{items.length} 笔</span>
            </div>
            <ul className="space-y-2">
              {items.map((e, i) => {
                const award = e.kind === "award";
                return (
                  <Reveal as="li" key={e.id} delay={Math.min(i, 6) * 45 + gi * 20}>
                    <div
                      className="card-soft group flex items-start gap-3 p-3 transition-transform duration-200 hover:-translate-y-[2px]"
                      style={{
                        borderLeft: `6px solid ${award ? "#e0455f" : "#2f4b7c"}`,
                      }}
                    >
                      <StickerChip
                        icon={e.icon}
                        size={40}
                        rotate={award ? -6 : 6}
                        cut={!award}
                        dim={!award}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="font-display text-[16px] text-ink">
                            {e.label}
                          </span>
                          <span
                            className="num text-[13px] font-bold"
                            style={{ color: award ? "#a92a44" : "#2f4b7c" }}
                          >
                            {award ? "+" : "−"}
                            {e.amount}
                          </span>
                          <span className="num ml-auto text-[11.5px] text-ink-3">
                            {formatClock(e.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 break-words text-[13.5px] leading-relaxed text-ink-2">
                          {e.reason}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {!canUndo ? null : confirmId === e.id ? (
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              disabled={busyId === e.id}
                              onClick={() => {
                                onUndo(e.id);
                                setConfirmId(null);
                              }}
                              className="rounded-md bg-berry px-2 py-1 text-[11px] font-bold text-[#fff8ee]"
                            >
                              {busyId === e.id ? "…" : "确定"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmId(null)}
                              className="rounded-md border border-ink/25 px-2 py-1 text-[11px] text-ink-2"
                            >
                              算了
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmId(e.id)}
                            className="rounded-md px-2 py-1 text-[11.5px] text-ink-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100"
                          >
                            撤销
                          </button>
                        )}
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
