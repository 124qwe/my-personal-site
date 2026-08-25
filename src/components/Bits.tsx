"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function prefersReduced() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** 数字滚动 */
export function Counter({
  value,
  className = "",
  duration = 780,
}: {
  value: number;
  className?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useIsoLayoutEffect(() => {
    if (prefersReduced()) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }
    const from = fromRef.current;
    if (from === value) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = value;
    };
  }, [value, duration]);

  return <span className={`num ${className}`}>{display}</span>;
}

/** 滚动进入视口时揭示 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (prefersReduced()) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (items) => {
        items.forEach((item) => {
          if (item.isIntersecting) {
            setShown(true);
            io.unobserve(item.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={`reveal ${shown ? "in" : ""} ${className}`}
      style={{ ["--rd" as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/** 贴纸本体 */
export function StickerChip({
  icon,
  size = 44,
  rotate = 0,
  cut = false,
  delay = 0,
  pop = false,
  dim = false,
  title,
}: {
  icon: string;
  size?: number;
  rotate?: number;
  cut?: boolean;
  delay?: number;
  pop?: boolean;
  dim?: boolean;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`sticker ${cut ? "sticker-cut" : ""} ${pop ? "animate-pop" : ""} ${
        dim ? "opacity-40 grayscale" : ""
      }`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.52,
        ["--r" as string]: `${rotate}deg`,
        transform: `rotate(${rotate}deg)`,
        animationDelay: `${delay}ms`,
      }}
    >
      {icon}
    </span>
  );
}

export function SectionTitle({
  index,
  title,
  desc,
  accent = "#e0455f",
}: {
  index: string;
  title: string;
  desc?: string;
  accent?: string;
}) {
  return (
    <div className="mb-6 flex items-end gap-3">
      <span
        className="num shrink-0 text-[13px] font-bold tracking-widest text-paper"
        style={{
          background: "#2b1a21",
          borderRadius: "8px 8px 8px 2px",
          padding: "5px 8px 3px",
        }}
      >
        {index}
      </span>
      <div className="min-w-0">
        <h2
          className="font-display text-[26px] leading-none sm:text-[32px]"
          style={{ color: "#2b1a21" }}
        >
          {title}
        </h2>
        {desc ? (
          <p className="mt-1.5 text-[12.5px] text-ink-3 sm:text-[13.5px]">
            {desc}
          </p>
        ) : null}
      </div>
      <span
        className="mb-1.5 ml-auto hidden h-[3px] flex-1 rounded-full sm:block"
        style={{ background: accent, opacity: 0.5 }}
      />
    </div>
  );
}
