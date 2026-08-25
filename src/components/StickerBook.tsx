"use client";

import { StickerChip } from "@/components/Bits";

export function StickerBook({
  available,
  wishCost,
  icons,
}: {
  available: number;
  wishCost: number;
  icons: string[];
}) {
  const wishCount = Math.floor(available / wishCost);
  const filled = wishCount > 0 ? wishCost : available % wishCost;
  const lack = wishCost - (available % wishCost);
  const pct = Math.min(100, Math.round((filled / wishCost) * 100));
  const pool = icons.length ? icons : ["🌟", "🍓", "🐻", "🌈", "💌"];

  return (
    <div className="card relative overflow-hidden p-4 sm:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="font-display text-[19px] text-ink">许愿进度</h3>
        <span className="num text-[13px] font-bold text-ink-3">
          {filled} / {wishCost}
        </span>
      </div>

      <div
        className="grid gap-[7px] sm:gap-2"
        style={{
          gridTemplateColumns: `repeat(${wishCost > 24 ? 10 : 5}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: wishCost }, (_, i) => {
          const on = i < filled;
          return (
            <div
              key={i}
              className="flex aspect-square items-center justify-center"
              style={{
                borderRadius: 12,
                border: on ? "none" : "2px dashed rgba(43,26,33,0.22)",
                background: on ? "transparent" : "rgba(255,255,255,0.45)",
              }}
            >
              {on ? (
                <StickerChip
                  icon={pool[i % pool.length]}
                  size={30}
                  rotate={((i * 37) % 21) - 10}
                  cut={i % 3 === 0}
                  pop
                  delay={i * 26}
                />
              ) : (
                <span className="num text-[11px] text-ink-3/45">{i + 1}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 h-[10px] w-full overflow-hidden rounded-full border-2 border-ink/85 bg-paper-2">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{
            width: `${wishCount > 0 ? 100 : pct}%`,
            background:
              "repeating-linear-gradient(45deg,#e0455f 0 8px,#f06a80 8px 16px)",
          }}
        />
      </div>

      <p
        className="mt-3 text-[13.5px] leading-relaxed"
        style={{ color: wishCount > 0 ? "#a92a44" : "#55404a" }}
      >
        {wishCount > 0 ? (
          <>
            <strong className="font-display text-[16px]">可以许 {wishCount} 个愿望啦！</strong>
            <br />
            攒了 {available} 张，另外还有 {available % wishCost} 张正在攒下一个。
          </>
        ) : (
          <>
            再攒 <strong className="num text-[17px] text-berry">{lack}</strong>{" "}
            张就能许一个愿望，加油呀。
          </>
        )}
      </p>
    </div>
  );
}
