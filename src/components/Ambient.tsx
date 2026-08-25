"use client";

import { useEffect, useState } from "react";

/* ---------------- 环境背景 ---------------- */

const DRIFTERS: Array<{
  left: string;
  icon: string;
  size: number;
  dur: string;
  delay: string;
  tx: string;
  opacity: number;
}> = [
  { left: "4%", icon: "✦", size: 16, dur: "34s", delay: "0s", tx: "40px", opacity: 0.5 },
  { left: "13%", icon: "❤", size: 12, dur: "44s", delay: "6s", tx: "-30px", opacity: 0.35 },
  { left: "22%", icon: "✿", size: 14, dur: "38s", delay: "12s", tx: "26px", opacity: 0.3 },
  { left: "31%", icon: "★", size: 18, dur: "50s", delay: "3s", tx: "-46px", opacity: 0.4 },
  { left: "41%", icon: "❤", size: 10, dur: "40s", delay: "18s", tx: "34px", opacity: 0.3 },
  { left: "52%", icon: "✦", size: 13, dur: "46s", delay: "9s", tx: "-22px", opacity: 0.35 },
  { left: "61%", icon: "✿", size: 17, dur: "36s", delay: "21s", tx: "48px", opacity: 0.28 },
  { left: "70%", icon: "★", size: 11, dur: "52s", delay: "15s", tx: "-38px", opacity: 0.4 },
  { left: "79%", icon: "❤", size: 15, dur: "42s", delay: "4s", tx: "20px", opacity: 0.32 },
  { left: "88%", icon: "✦", size: 12, dur: "48s", delay: "26s", tx: "-28px", opacity: 0.36 },
  { left: "95%", icon: "✿", size: 14, dur: "39s", delay: "11s", tx: "18px", opacity: 0.3 },
  { left: "47%", icon: "★", size: 9, dur: "56s", delay: "30s", tx: "-16px", opacity: 0.34 },
];

export function Ambient() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1100px 620px at 8% -8%, #ffe4d2 0%, transparent 58%)," +
            "radial-gradient(900px 540px at 104% 6%, #ffe0ec 0%, transparent 55%)," +
            "radial-gradient(760px 700px at 50% 118%, #e7f0e2 0%, transparent 60%)," +
            "linear-gradient(180deg, #fdf3e4 0%, #fbeada 100%)",
        }}
      />
      <div className="dot-grid absolute inset-0 opacity-70" />
      <div className="absolute inset-x-0 top-0 h-[3px] bg-ink/85" />
      {DRIFTERS.map((d, i) => (
        <span
          key={i}
          className="animate-drift absolute bottom-[-12vh] text-berry"
          style={{
            left: d.left,
            fontSize: d.size,
            opacity: d.opacity,
            ["--d" as string]: d.dur,
            ["--delay" as string]: d.delay,
            ["--tx" as string]: d.tx,
            color: i % 3 === 0 ? "#e0455f" : i % 3 === 1 ? "#d99a2b" : "#2f7a6b",
          }}
        >
          {d.icon}
        </span>
      ))}
    </div>
  );
}

/* ---------------- 贴纸雨 ---------------- */

export type Burst = { key: number; icon: string; count: number; tone: "award" | "deduct" };

const PALETTE_AWARD = ["#e0455f", "#d99a2b", "#2f7a6b", "#2f4b7c", "#f08a5d"];
const PALETTE_DEDUCT = ["#8a7280", "#55404a", "#2f4b7c"];

export function StickerRain({ burst }: { burst: Burst | null }) {
  const [pieces, setPieces] = useState<
    Array<{ id: number; left: number; delay: number; dur: number; tx: number; rot: number; icon: string; color: string; size: number }>
  >([]);

  useEffect(() => {
    if (!burst) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const palette = burst.tone === "award" ? PALETTE_AWARD : PALETTE_DEDUCT;
    const total = Math.min(34, 12 + burst.count * 5);
    const next = Array.from({ length: total }, (_, i) => ({
      id: burst.key * 1000 + i,
      left: Math.random() * 100,
      delay: Math.random() * 260,
      dur: 1.5 + Math.random() * 1.1,
      tx: (Math.random() - 0.5) * 220,
      rot: 300 + Math.random() * 620,
      icon: Math.random() > 0.45 ? burst.icon : ["✦", "★", "❤", "✿"][i % 4],
      color: palette[i % palette.length],
      size: 14 + Math.random() * 16,
    }));
    setPieces(next);
    const t = setTimeout(() => setPieces([]), 3000);
    return () => clearTimeout(t);
  }, [burst]);

  if (!pieces.length) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="animate-fall absolute top-0"
          style={{
            left: `${p.left}%`,
            fontSize: p.size,
            color: p.color,
            animationDelay: `${p.delay}ms`,
            ["--d" as string]: `${p.dur}s`,
            ["--tx" as string]: `${p.tx}px`,
            ["--rot" as string]: `${p.rot}deg`,
          }}
        >
          {p.icon}
        </span>
      ))}
    </div>
  );
}

/* ---------------- 提示条 ---------------- */

export type Toast = { id: number; text: string; tone: "ok" | "bad" };

export function Toasts({ items }: { items: Toast[] }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[86px] z-[70] flex flex-col items-center gap-2 px-4 sm:bottom-8">
      {items.map((t) => (
        <div
          key={t.id}
          className="animate-pop max-w-[92vw] rounded-full border-2 border-ink px-4 py-2 text-[13.5px] font-medium shadow-[3px_4px_0_rgba(43,26,33,0.9)]"
          style={{
            background: t.tone === "ok" ? "#2f7a6b" : "#a92a44",
            color: "#fff8ee",
          }}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
