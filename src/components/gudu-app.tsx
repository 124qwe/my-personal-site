"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppSnapshot, GuduTask, Snapshot, TaskStatus } from "@/lib/gudu-types";

type IconName =
  | "home"
  | "send"
  | "check"
  | "book"
  | "gift"
  | "cup"
  | "list"
  | "shop"
  | "drop"
  | "medal"
  | "camera"
  | "clock"
  | "heart"
  | "close"
  | "chevron"
  | "sparkle"
  | "plus"
  | "logout"
  | "copy";

type ModalState =
  | { type: "photo"; task: GuduTask; kind: "start" | "finish" }
  | { type: "reject"; task: GuduTask }
  | { type: "skip"; task: GuduTask }
  | { type: "cheer" }
  | { type: "medal" }
  | { type: "adjust" }
  | { type: "reward" }
  | { type: "edit"; task: GuduTask }
  | { type: "pwa" }
  | { type: "logout" }
  | { type: "taskDetail"; task: GuduTask }
  | { type: "photoView"; url: string; caption?: string }
  | null;

const statusMeta: Record<TaskStatus, { label: string; className: string }> = {
  pending_accept: { label: "待接收", className: "status-wait" },
  in_progress: { label: "咕嘟中", className: "status-live" },
  pending_review: { label: "待认证", className: "status-review" },
  completed: { label: "已完成", className: "status-done" },
  failed: { label: "已失败", className: "status-fail" },
  skipped: { label: "金牌跳过", className: "status-skip" },
  cancelled: { label: "已撤回", className: "status-muted" },
};

const cheerPresets = [
  "喝完这杯，今天也要甜甜的。",
  "不是催你，是想把关心装进杯子里。",
  "小口慢慢喝，我会一直陪着你。",
];

function Icon({ name, size = 22, className = "" }: { name: IconName; size?: number; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></>,
    send: <><path d="M22 2 9.6 14.4"/><path d="m22 2-7.9 20-4.5-7.6L2 9.9 22 2Z"/></>,
    check: <><path d="m9 11 2 2 4-5"/><path d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></>,
    gift: <><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M7.5 8C5 8 5 4.5 7 4.5c2.5 0 5 3.5 5 3.5s2.5-3.5 5-3.5c2 0 2 3.5-.5 3.5"/></>,
    cup: <><path d="M5 5h12l-1 15H6L5 5Z"/><path d="M17 8h1.5a2.5 2.5 0 0 1 0 5H17M7 9h8"/></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></>,
    shop: <><path d="M3 9 5 3h14l2 6"/><path d="M5 13v8h14v-8M9 21v-6h6v6"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/></>,
    drop: <path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z"/>,
    medal: <><circle cx="12" cy="8" r="5"/><path d="m8.5 12-2 10 5.5-3 5.5 3-2-10"/></>,
    camera: <><path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3h5Z"/><circle cx="12" cy="13" r="3"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    sparkle: <><path d="m12 3 1.1 3.7L17 8l-3.9 1.3L12 13l-1.1-3.7L7 8l3.9-1.3L12 3Z"/><path d="m19 14 .7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7L19 14Z"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>{paths[name]}</svg>;
}

const moodMap: Record<string, string> = {
  "💧": "/images/mood-1.png",
  "💕": "/images/mood-2.png",
  "😤": "/images/mood-3.png",
  "👑": "/images/mood-4.png",
};

function MoodIcon({ emoji, size = 22, className = "" }: { emoji: string; size?: number; className?: string }) {
  const src = moodMap[emoji];
  if (!src) return <span className={className}>{emoji}</span>;
  return <img src={src} alt="心情" width={size} height={size} className={`mood-icon ${className}`}/>;
}

function formatClock(date: string | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(date));
}

function dayLabel(date: string) {
  const input = new Date(date);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  const key = input.toDateString();
  if (key === today.toDateString()) return "今天";
  if (key === yesterday.toDateString()) return "昨天";
  return new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "short" }).format(input);
}

function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

function remaining(deadline: string | null, now: number) {
  if (!deadline) return "等待计时";
  const diff = new Date(deadline).getTime() - now;
  if (diff <= 0) return "已超时";
  const total = Math.floor(diff / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

async function compressImage(file: File) {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("读取照片失败"));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const item = document.createElement("img");
    item.onload = () => resolve(item);
    item.onerror = () => reject(new Error("照片格式不支持"));
    item.src = source;
  });
  const max = 1280;
  const scale = Math.min(1, max / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

function MetricPill({ icon, value, label, warm = false }: { icon: "drop" | "medal"; value: number; label: string; warm?: boolean }) {
  return <div className={`metric-pill ${warm ? "metric-warm" : ""}`}><span className="metric-icon"><Icon name={icon} size={17}/></span><span className="metric-number">{value}</span><span className="metric-label">{label}</span></div>;
}

function EmptyCup({ small = false }: { small?: boolean }) {
  return <div className={`empty-cup ${small ? "empty-cup-small" : ""}`} aria-hidden="true"><div className="cup-handle"/><div className="cup-body"><span/><span/><span/></div><div className="cup-shadow"/></div>;
}

function Countdown({ task }: { task: GuduTask }) {
  const now = useNow();
  const target = task.status === "pending_accept" ? task.acceptDeadline : task.finishDeadline;
  const time = remaining(target, now);
  const expired = time === "已超时";
  if (task.status === "pending_review") return <span className="countdown countdown-review"><span className="pulse-dot"/>正在等待发送机认证</span>;
  if (!(["pending_accept", "in_progress"] as string[]).includes(task.status)) return null;
  return <span className={`countdown ${expired ? "countdown-expired" : ""}`}><Icon name="clock" size={15}/>{task.status === "pending_accept" ? "还需" : "剩余"} <b>{time}</b></span>;
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const meta = statusMeta[status];
  return <span className={`status-badge ${meta.className}`}>{meta.label}</span>;
}

function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  return <div className="section-title"><div>{eyebrow && <p>{eyebrow}</p>}<h2>{title}</h2></div>{action}</div>;
}

function TaskCard({ task, role, onPhoto, onSkip, onCancel, onEdit }: {
  task: GuduTask;
  role: "sender" | "star";
  onPhoto?: (task: GuduTask, kind: "start" | "finish") => void;
  onSkip?: (task: GuduTask) => void;
  onCancel?: (task: GuduTask) => void;
  onEdit?: (task: GuduTask) => void;
}) {
  const current = ["pending_accept", "in_progress", "pending_review"].includes(task.status);
  return <article className={`task-card ${current ? "task-card-current" : ""}`}>
    <div className="task-topline"><span className="task-emoji"><MoodIcon emoji={task.emoji} size={24}/></span>{task.kind === "daily" && <span className="daily-tag">日常</span>}<StatusBadge status={task.status}/><span className="task-time">{formatClock(task.createdAt)}</span></div>
    <div className="task-volume"><strong>{task.ml}</strong><span>ml × {task.cups} 杯</span></div>
    {task.loveNote && <blockquote>“{task.loveNote}”</blockquote>}
    {task.miniTask && <div className="mini-task"><Icon name="sparkle" size={15}/><span>附加任务：{task.miniTask}</span></div>}
    {task.rejectReason && task.status === "in_progress" && <div className="reject-note"><b>需要重拍</b><span>{task.rejectReason}</span></div>}
    <Countdown task={task}/>
    {role === "star" && task.status === "pending_accept" && <button className="primary-button task-action" onClick={() => onPhoto?.(task, "start")}><Icon name="camera"/>接受任务并拍开始</button>}
    {role === "star" && task.status === "in_progress" && <div className="task-buttons"><button className="primary-button task-action" onClick={() => onPhoto?.(task, "finish")}><Icon name="camera"/>拍喝完照片</button><button className="ghost-square" title="使用免死金牌" onClick={() => onSkip?.(task)}><Icon name="medal"/></button></div>}
    {role === "sender" && task.status === "pending_accept" && <div className="sender-task-actions"><button className="text-button" onClick={() => onEdit?.(task)}>修改指令</button><button className="text-button danger-text" onClick={() => onCancel?.(task)}>撤回这杯</button></div>}
  </article>;
}

function SetupScreen({ onReady, notify }: { onReady: () => Promise<void>; notify: (message: string, error?: boolean) => void }) {
  const [mode, setMode] = useState<"intro" | "sender" | "join">("intro");
  const [busy, setBusy] = useState(false);
  const [queryCode, setQueryCode] = useState("");

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code") ?? "";
    if (code) {
      setQueryCode(code.toUpperCase());
      setMode("join");
    }
  }, []);

  async function submit(payload: Record<string, unknown>) {
    setBusy(true);
    try {
      const response = await fetch("/api/app", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok) throw new Error(data.error || "星球信号走丢了");
      await onReady();
    } catch (error) {
      notify(error instanceof Error ? error.message : "操作失败", true);
    } finally {
      setBusy(false);
    }
  }

  return <main className="setup-shell">
    <div className="orbit orbit-one"/><div className="orbit orbit-two"/>
    <section className="setup-card">
      <header className="brand-lockup"><span className="brand-mark"><Icon name="drop" size={18}/></span><span>咕嘟星球</span></header>
      <div className="setup-art"><Image src="/images/gudu-planet.png" alt="一颗可爱的水滴星球" priority width={520} height={520}/></div>
      {mode === "intro" && <div className="setup-copy">
        <span className="eyebrow-chip">ONLY FOR TWO</span>
        <h1>把关心，<br/><em>装进每一杯水。</em></h1>
        <p>只有你们两个人的私密喝水监督小站。<br/>轻轻提醒，认真回应。</p>
        <div className="setup-actions">
          <button className="primary-button large-button" onClick={() => setMode("sender")}><Icon name="send"/>我是咕嘟发送机</button>
          <button className="secondary-button large-button" onClick={() => setMode("join")}><Icon name="drop"/>我是咕嘟咕嘟星人</button>
        </div>
        <div className="privacy-line"><span/><small>一次配对 · 私密专属 · 照片 5 天后漂走</small><span/></div>
      </div>}
      {mode === "sender" && <form className="setup-form" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void submit({ action: "create_pair", nickname: form.get("nickname") }); }}>
        <button type="button" className="back-link" onClick={() => setMode("intro")}>← 返回</button>
        <span className="eyebrow-chip">CREATE A PLANET</span>
        <h1>先点亮一颗<br/><em>属于你们的星球</em></h1>
        <label>你的称呼<input name="nickname" placeholder="咕嘟发送机" maxLength={40}/></label>
        <button disabled={busy} className="primary-button large-button" type="submit">{busy ? "正在点亮…" : "生成专属配对码"}<Icon name="sparkle"/></button>
      </form>}
      {mode === "join" && <form className="setup-form" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void submit({ action: "join_pair", code: form.get("code"), nickname: form.get("nickname") }); }}>
        <button type="button" className="back-link" onClick={() => setMode("intro")}>← 返回</button>
        <span className="eyebrow-chip">LANDING NOW</span>
        <h1>准备降落到<br/><em>你们的咕嘟星球</em></h1>
        <label>配对码<input name="code" defaultValue={queryCode} placeholder="GUDU-7K2P" autoCapitalize="characters" required maxLength={9}/></label>
        <label>你的称呼<input name="nickname" placeholder="咕嘟咕嘟星人" maxLength={40}/></label>
        <button disabled={busy} className="primary-button large-button" type="submit">{busy ? "正在降落…" : "确认降落"}<Icon name="drop"/></button>
      </form>}
    </section>
  </main>;
}

function WaitingScreen({ data, onRefresh, open, notify }: { data: AppSnapshot; onRefresh: (alreadyPaired: boolean) => Promise<void>; open: (modal: ModalState) => void; notify: (message: string) => void }) {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const link = `${origin}/?code=${data.pairCode}`;
  function copy(value: string, message: string) {
    void navigator.clipboard.writeText(value).then(() => notify(message));
  }
  return <main className="waiting-shell">
    <section className="waiting-card">
      <header className="brand-lockup"><span className="brand-mark"><Icon name="drop" size={18}/></span><span>咕嘟星球</span></header>
      <div className="waiting-art"><Image src="/images/gudu-planet.png" alt="等待星人降落" width={420} height={420}/><span className="signal signal-a"/><span className="signal signal-b"/><span className="signal signal-c"/></div>
      <span className="eyebrow-chip">PLANET IS ONLINE</span>
      <h1>等待星人降落<span className="loading-dots">…</span></h1>
      <p>把下面的配对码或邀请链接发给 TA。<br/>成功绑定后，这枚码会立即失效。</p>
      <button className="pair-code" onClick={() => copy(data.pairCode, "配对码已复制")}><span>{data.pairCode}</span><Icon name="copy" size={19}/></button>
      <div className="waiting-actions"><button className="primary-button" onClick={() => copy(link, "链接已复制")}>复制邀请链接</button><button className="secondary-button" onClick={() => void onRefresh(data.paired)}>我来看看</button></div>
      <button className="text-button logout-link" onClick={() => open({ type: "logout" })}><Icon name="logout" size={16}/>退出这颗星球</button>
    </section>
  </main>;
}

function AppHeader({ data, open }: { data: AppSnapshot; open: (modal: ModalState) => void }) {
  const date = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "short" }).format(new Date());
  return <header className="app-header"><div><p>{date}</p><h1>{data.role === "sender" ? "早上好，" : "欢迎回来，"}{data.nickname}<span>。</span></h1></div><div className="header-actions"><button className="pwa-icon-pill" onClick={() => open({ type: "pwa" })} title="添加到手机主屏幕"><img src="/apple-touch-icon.png" alt="主屏幕图标预览" width={22} height={22}/><span>放桌面</span></button><button className="avatar-button" onClick={() => open({ type: "logout" })} title="退出登录"><img src={data.role === "sender" ? "/images/avatar-sender.png" : "/images/avatar-star.png"} alt="个人头像" width={43} height={43}/><i/></button></div></header>;
}

function TodayCard({ data }: { data: AppSnapshot }) {
  return <section className="today-card">
    <div className="today-heading"><span><Icon name="sparkle" size={17}/>TODAY REPORT</span><b>{data.today.netDrops >= 0 ? "+" : ""}{data.today.netDrops} 💧</b></div>
    <div className="today-metrics"><div><strong>{data.today.sent}</strong><span>今日派水</span></div><i/><div><strong>{data.today.completed}</strong><span>认证完成</span></div><i/><div><strong>{data.today.ml}</strong><span>喝下 ml</span></div></div>
    <div className="today-track"><span style={{ width: `${data.today.sent ? Math.max(8, data.today.completed / data.today.sent * 100) : 0}%` }}/></div>
    <p>{data.today.sent === 0 ? "水塔暂时平静，今天还没有发出指令。" : data.today.completed === data.today.sent ? "每一杯都有回应，今天的星球亮晶晶。" : `还有 ${Math.max(0, data.today.sent - data.today.completed - data.today.failed - data.today.skipped)} 杯正在路上。`}</p>
  </section>;
}

function SenderHome({ data, navigate, open, act }: { data: AppSnapshot; navigate: (tab: string) => void; open: (modal: ModalState) => void; act: (payload: Record<string, unknown>) => Promise<boolean> }) {
  const active = data.tasks.filter((task) => ["pending_accept", "in_progress", "pending_review"].includes(task.status));
  const reviews = active.filter((task) => task.status === "pending_review");
  return <div className="tab-page page-enter">
    <div className="balance-row"><MetricPill icon="drop" value={data.drops} label="小水滴"/><MetricPill icon="medal" value={data.medals} label="免死金牌" warm/></div>
    <button className="dispatch-hero" onClick={() => navigate("send")}><div className="dispatch-icon"><Icon name="send" size={29}/><span/></div><div><small>QUICK COMMAND</small><strong>派一杯水</strong><p>让一份关心，现在就出发</p></div><Icon name="chevron" className="dispatch-arrow"/></button>
    {reviews.length > 0 && <button className="review-alert" onClick={() => navigate("review")}><span className="review-photo"><Icon name="camera"/><i>{reviews.length}</i></span><span><b>星人的作业送达啦</b><small>{reviews[0].ml}ml 正在等你认证</small></span><Icon name="chevron"/></button>}
    <div className="quick-grid"><button onClick={() => open({ type: "cheer" })}><span className="quick-pink"><Icon name="heart"/></span><b>说句鼓励</b><small>送一颗小心心</small></button><button onClick={() => open({ type: "medal" })}><span className="quick-gold"><Icon name="medal"/></span><b>发免死金牌</b><small>偶尔也要放个假</small></button></div>
    <TodayCard data={data}/>
    <SectionTitle eyebrow="LIVE MISSIONS" title="进行中的水杯" action={<button onClick={() => navigate("review")}>查看全部</button>}/>
    <div className="stack-list">{active.length ? active.slice(0, 3).map((task) => <TaskCard key={task.id} task={task} role="sender" onEdit={(item) => open({ type: "edit", task: item })} onCancel={(item) => void act({ action: "cancel_task", taskId: item.id })}/>) : <div className="soft-empty"><EmptyCup small/><div><b>水塔暂时平静</b><span>派出一杯，让关心开始流动。</span></div></div>}</div>
  </div>;
}

function SendTab({ act, navigate }: { act: (payload: Record<string, unknown>) => Promise<boolean>; navigate: (tab: string) => void }) {
  const [ml, setMl] = useState(300);
  const [cups, setCups] = useState(1);
  const [emoji, setEmoji] = useState("💧");
  const [note, setNote] = useState("");
  const [mini, setMini] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await act({ action: "create_task", ml, cups, emoji, loveNote: note, miniTask: mini })) {
      setNote(""); setMini(""); navigate("home");
    }
  }
  return <form className="tab-page page-enter" onSubmit={submit}>
    <div className="page-intro"><span className="eyebrow-chip">NEW COMMAND</span><h2>今天，想派多大一杯？</h2><p>任务发出后，星人有 30 分钟准备出发。</p></div>
    <section className="form-card volume-picker"><label>容量</label><div className="volume-input"><button type="button" onClick={() => setMl(Math.max(50, ml - 50))}>−</button><div><input aria-label="毫升" type="number" min={50} max={3000} value={ml} onChange={(e) => setMl(Number(e.target.value))}/><span>ml</span></div><button type="button" onClick={() => setMl(Math.min(3000, ml + 50))}>＋</button></div><div className="preset-row">{[300, 500, 750].map((value) => <button type="button" className={ml === value ? "active" : ""} key={value} onClick={() => setMl(value)}>{value}ml</button>)}</div></section>
    <section className="form-card"><div className="field-row"><label>杯数</label><div className="stepper"><button type="button" onClick={() => setCups(Math.max(1, cups - 1))}>−</button><b>{cups}</b><button type="button" onClick={() => setCups(Math.min(10, cups + 1))}>＋</button></div></div></section>
    <section className="form-card"><label>给这杯水一个心情</label><div className="emoji-row mood-row">{(["💧", "💕", "😤", "👑"] as const).map((item, index) => <button type="button" className={`mood-pick ${emoji === item ? "active" : ""}`} onClick={() => setEmoji(item)} key={item}><img src={`/images/mood-${index + 1}.png`} alt="心情" width={46} height={46}/></button>)}</div></section>
    <section className="form-card text-fields"><label>顺便说句情话 <small>选填</small><textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={240} placeholder="喝完这杯，今天也要甜甜的。"/><div className="suggestion-chips">{cheerPresets.slice(0, 2).map((item) => <button type="button" onClick={() => setNote(item)} key={item}>{item.slice(0, 8)}…</button>)}</div></label><label>附加一个小任务 <small>选填</small><input value={mini} onChange={(e) => setMini(e.target.value)} maxLength={240} placeholder="例如：喝的时候看我一眼"/></label></section>
    <button className="primary-button send-submit" type="submit"><Icon name="send"/>咕嘟指令，发射</button>
    <p className="form-footnote"><Icon name="clock" size={14}/>接受后将拥有完整的 2 小时喝完</p>
  </form>;
}

function ReviewTab({ data, act, open }: { data: AppSnapshot; act: (payload: Record<string, unknown>) => Promise<boolean>; open: (modal: ModalState) => void }) {
  const pending = data.tasks.filter((task) => task.status === "pending_review");
  return <div className="tab-page page-enter"><div className="page-intro"><span className="eyebrow-chip">WATER CHECK</span><h2>认真对比，温柔认证</h2><p>{pending.length ? `${pending.length} 份作业正等你签收。` : "暂时没有待审核的作业。"}</p></div>
    <div className="stack-list review-list">{pending.map((task) => <article className="review-card" key={task.id}><div className="review-card-head"><div><span className="review-mood"><MoodIcon emoji={task.emoji} size={24}/></span><p><b>{task.ml}ml × {task.cups}</b><small>{formatClock(task.submittedAt)} 提交</small></p></div><StatusBadge status={task.status}/></div><div className="photo-compare"><figure>{task.startPhotoUrl ? <img src={task.startPhotoUrl} alt="开始喝之前"/> : <div>照片已漂走</div>}<figcaption>开始 · BEFORE</figcaption></figure><span className="compare-arrow">→</span><figure>{task.endPhotoUrl ? <img src={task.endPhotoUrl} alt="喝完之后"/> : <div>照片已漂走</div>}<figcaption>喝完 · AFTER</figcaption></figure></div>{task.loveNote && <p className="review-note">“{task.loveNote}”</p>}<div className="review-actions"><button className="secondary-button" onClick={() => open({ type: "reject", task })}>需要重拍</button><button className="primary-button" onClick={() => void act({ action: "review_task", taskId: task.id, decision: "approve" })}><Icon name="check"/>认证通过</button></div></article>)}
      {!pending.length && <div className="large-empty"><EmptyCup/><h3>审核台干干净净</h3><p>星人的下一份喝水作业，会出现在这里。</p></div>}
    </div>
    {data.tasks.some((task) => ["pending_accept", "in_progress"].includes(task.status)) && <><SectionTitle eyebrow="ON THE WAY" title="还在路上的水杯"/><div className="stack-list">{data.tasks.filter((task) => ["pending_accept", "in_progress"].includes(task.status)).map((task) => <TaskCard key={task.id} task={task} role="sender" onEdit={(item) => open({ type: "edit", task: item })} onCancel={(item) => void act({ action: "cancel_task", taskId: item.id })}/>)}</div></>}
  </div>;
}

function DiaryTab({ data, open }: { data: AppSnapshot; open: (modal: ModalState) => void }) {
  const groups = useMemo(() => {
    const result = new Map<string, GuduTask[]>();
    data.tasks.forEach((task) => { const key = new Date(task.createdAt).toDateString(); result.set(key, [...(result.get(key) ?? []), task]); });
    return [...result.values()];
  }, [data.tasks]);
  return <div className="tab-page page-enter"><div className="page-intro"><span className="eyebrow-chip">PLANET LOG</span><h2>每一口，都有回声</h2><p>点击记录可以查看详情，照片只停泊最近 5 天。</p></div>
    <div className="diary-timeline">{groups.map((items) => { const done = items.filter((item) => item.status === "completed"); return <section className="diary-day" key={items[0].createdAt}><div className="diary-date"><span>{dayLabel(items[0].createdAt)}</span><b>{done.reduce((sum, item) => sum + item.ml * item.cups, 0)} ml</b></div><div className="diary-day-card">{items.map((task, index) => <div className="diary-entry" key={task.id} onClick={() => open({ type: "taskDetail", task })}><div className="timeline-mark"><i className={statusMeta[task.status].className}/>{index < items.length - 1 && <span/>}</div><div className="diary-content"><div><b><MoodIcon emoji={task.emoji} size={20}/> {task.ml}ml × {task.cups}</b>{task.kind === "daily" && <span className="daily-tag">日常</span>}<StatusBadge status={task.status}/></div><p>{task.status === "completed" ? `开始 ${formatClock(task.startedAt).split(" ").pop()} · 完成 ${formatClock(task.submittedAt).split(" ").pop()}` : task.failReason || task.rejectReason || statusMeta[task.status].label}</p>{(task.startPhotoUrl || task.endPhotoUrl) ? <div className="diary-thumbs">{task.startPhotoUrl && <img src={task.startPhotoUrl} alt="开始照片" onClick={(e) => { e.stopPropagation(); open({ type: "photoView", url: task.startPhotoUrl!, caption: "开始喝之前" }); }}/>}{task.endPhotoUrl && <img src={task.endPhotoUrl} alt="完成照片" onClick={(e) => { e.stopPropagation(); open({ type: "photoView", url: task.endPhotoUrl!, caption: "喝完之后" }); }}/>}</div> : new Date(task.createdAt).getTime() < Date.now() - 5 * 86400000 ? <small className="photo-gone">☁ 照片已漂走，记忆还在</small> : null}</div></div>)}</div></section>; })}
      {!groups.length && <div className="large-empty"><Icon name="book" size={42}/><h3>日记还是空白页</h3><p>第一杯水发出后，故事就开始了。</p></div>}
    </div>
  </div>;
}

function SenderRewards({ data, act, open }: { data: AppSnapshot; act: (payload: Record<string, unknown>) => Promise<boolean>; open: (modal: ModalState) => void }) {
  const pending = data.redemptions.filter((item) => item.status === "pending" || item.status === "approved");
  return <div className="tab-page page-enter"><div className="page-intro inline-intro"><div><span className="eyebrow-chip">REWARD CABINET</span><h2>攒下的认真，要有奖励</h2></div><button className="round-add" onClick={() => open({ type: "reward" })}><Icon name="plus"/></button></div>
    {pending.length > 0 && <section><SectionTitle eyebrow="TO-DO" title="待处理兑换"/><div className="stack-list">{pending.map((item) => <article className="redemption-card" key={item.id}><span>🎫</span><div><b>{item.rewardTitle}</b><small>{item.cost} 💧 · {item.status === "pending" ? "等待确认" : "等待履行"}</small></div>{item.status === "pending" ? <div className="mini-actions"><button onClick={() => void act({ action: "handle_redemption", redemptionId: item.id, decision: "reject" })}>婉拒</button><button onClick={() => void act({ action: "handle_redemption", redemptionId: item.id, decision: "approve" })}>确认</button></div> : <button className="done-button" onClick={() => void act({ action: "handle_redemption", redemptionId: item.id, decision: "done" })}>已履行</button>}</article>)}</div></section>}
    <SectionTitle eyebrow="IN STOCK" title="星球奖品" action={<span className="section-count">{data.rewards.filter((item) => item.active).length} 件上架</span>}/><div className="reward-grid">{data.rewards.map((reward) => <article className={`reward-card ${!reward.active ? "reward-off" : ""}`} key={reward.id}><div className="reward-emoji">{reward.emoji}</div><div className="reward-cost"><Icon name="drop" size={14}/>{reward.cost}</div><h3>{reward.title}</h3><p>{reward.description || "一份专属于你们的奖励"}</p><button onClick={() => void act({ action: "toggle_reward", rewardId: reward.id })}>{reward.active ? "下架" : "重新上架"}</button></article>)}</div>
    <SectionTitle eyebrow="MANUAL CARE" title="手动照顾一下"/><div className="care-actions"><button onClick={() => open({ type: "medal" })}><span><Icon name="medal"/></span><div><b>发一张免死金牌</b><small>星人库存 {data.medals} 张</small></div><Icon name="chevron"/></button><button onClick={() => open({ type: "adjust" })}><span><Icon name="drop"/></span><div><b>调整小水滴</b><small>生病或额外奖励时使用</small></div><Icon name="chevron"/></button></div>
  </div>;
}

function StarHome({ data, open }: { data: AppSnapshot; open: (modal: ModalState) => void }) {
  const active = data.tasks.filter((task) => ["pending_accept", "in_progress", "pending_review"].includes(task.status));
  const latestCheer = data.cheers[0];
  return <div className="tab-page page-enter"><div className="balance-row"><MetricPill icon="drop" value={data.drops} label="小水滴"/><MetricPill icon="medal" value={data.medals} label="免死金牌" warm/></div>
    {latestCheer && <div className="latest-cheer"><span>{latestCheer.emoji}</span><div><small>来自发送机 · {formatClock(latestCheer.createdAt)}</small><p>{latestCheer.text}</p></div></div>}
    {active.length ? <div className="star-current"><SectionTitle eyebrow="CURRENT CUP" title={active.length > 1 ? `${active.length} 杯正在等你` : "现在，该喝这杯"}/>{active.map((task) => <TaskCard key={task.id} task={task} role="star" onPhoto={(item, kind) => open({ type: "photo", task: item, kind })} onSkip={(item) => open({ type: "skip", task: item })}/>)}</div> : <section className="star-empty"><div className="star-empty-orbit"/><Image src="/images/gudu-planet.png" alt="平静的咕嘟星球" width={330} height={330}/><span className="eyebrow-chip">ALL CLEAR</span><h2>水塔暂时平静</h2><p>今天还很安全…暂时。<br/>趁发送机没注意，先伸个懒腰吧。</p></section>}
    <TodayCard data={data}/>
    {data.cheers.length > 1 && <><SectionTitle eyebrow="LOVE LETTERS" title="以前收到的鼓励"/><div className="cheer-history">{data.cheers.slice(1, 5).map((cheer) => <article key={cheer.id}><span>{cheer.emoji}</span><p>{cheer.text}<small>{formatClock(cheer.createdAt)}</small></p></article>)}</div></>}
  </div>;
}

function StarTasks({ data, open }: { data: AppSnapshot; open: (modal: ModalState) => void }) {
  const active = data.tasks.filter((task) => ["pending_accept", "in_progress", "pending_review"].includes(task.status));
  const today = data.tasks.filter((task) => new Date(task.createdAt).toDateString() === new Date().toDateString() && !active.includes(task));
  return <div className="tab-page page-enter"><div className="page-intro"><span className="eyebrow-chip">MY MISSIONS</span><h2>{data.nickname}的今日任务单</h2><p>一杯一杯来，不着急，但要记得回应。</p></div><SectionTitle eyebrow="IN PROGRESS" title="正在进行"/><div className="stack-list">{active.length ? active.map((task) => <TaskCard key={task.id} task={task} role="star" onPhoto={(item, kind) => open({ type: "photo", task: item, kind })} onSkip={(item) => open({ type: "skip", task: item })}/>) : <div className="soft-empty"><EmptyCup small/><div><b>现在没有任务</b><span>水塔静悄悄的。</span></div></div>}</div><SectionTitle eyebrow="TODAY" title="今天的足迹"/><div className="stack-list compact-tasks">{today.length ? today.map((task) => <TaskCard key={task.id} task={task} role="star"/>) : <p className="muted-copy">今天还没有完成记录。</p>}</div></div>;
}

function ExchangeTab({ data, act }: { data: AppSnapshot; act: (payload: Record<string, unknown>) => Promise<boolean> }) {
  return <div className="tab-page page-enter"><section className="wallet-card"><div><span>MY LITTLE DROPS</span><p><Icon name="drop" size={28}/><strong>{data.drops}</strong><small>朵</small></p><em>每一次认真喝完，都被好好记住。</em></div><div className="wallet-medal"><Icon name="medal"/><b>{data.medals}</b><span>免死金牌</span></div></section><div className="page-intro shop-intro"><span className="eyebrow-chip">WISH MARKET</span><h2>想要什么，就用认真来换</h2></div><div className="shop-list">{data.rewards.filter((reward) => reward.active).map((reward) => { const can = data.drops >= reward.cost; const pending = data.redemptions.some((item) => item.rewardId === reward.id && ["pending", "approved"].includes(item.status)); return <article className="shop-card" key={reward.id}><span className="shop-emoji">{reward.emoji}</span><div><h3>{reward.title}</h3><p>{reward.description || "来自发送机的专属奖励"}</p><b><Icon name="drop" size={15}/>{reward.cost} 朵</b></div><button disabled={!can || pending} onClick={() => void act({ action: "redeem_reward", rewardId: reward.id })}>{pending ? "进行中" : can ? "兑换" : `差 ${reward.cost - data.drops}`}</button></article>; })}</div>
    {data.redemptions.length > 0 && <><SectionTitle eyebrow="MY ORDERS" title="兑换记录"/><div className="order-list">{data.redemptions.slice(0, 8).map((item) => <div key={item.id}><span className={`order-dot order-${item.status}`}/><p><b>{item.rewardTitle}</b><small>{formatClock(item.createdAt)}</small></p><em>{item.status === "pending" ? "待确认" : item.status === "approved" ? "待履行" : item.status === "done" ? "已履行" : "已婉拒"}</em></div>)}</div></>}
  </div>;
}

function BottomNav({ role, active, setActive, reviewCount }: { role: "sender" | "star"; active: string; setActive: (tab: string) => void; reviewCount: number }) {
  const sender = [{ id: "home", label: "指挥台", icon: "home" }, { id: "send", label: "派水", icon: "send" }, { id: "review", label: "审核", icon: "check" }, { id: "diary", label: "日记", icon: "book" }, { id: "rewards", label: "奖品柜", icon: "gift" }] as const;
  const star = [{ id: "home", label: "水杯", icon: "cup" }, { id: "tasks", label: "任务", icon: "list" }, { id: "diary", label: "日记", icon: "book" }, { id: "exchange", label: "兑换", icon: "shop" }] as const;
  const items = role === "sender" ? sender : star;
  return <nav className={`bottom-nav ${role === "star" ? "bottom-nav-four" : ""}`}>{items.map((item) => <button key={item.id} className={active === item.id ? "active" : ""} onClick={() => setActive(item.id)}><span><Icon name={item.icon}/>{item.id === "review" && reviewCount > 0 && <i>{reviewCount}</i>}</span><small>{item.label}</small></button>)}</nav>;
}

function Dialog({ modal, data, busy, close, act, notify, onLogout, open }: { modal: Exclude<ModalState, null>; data: AppSnapshot; busy: boolean; close: () => void; act: (payload: Record<string, unknown>) => Promise<boolean>; notify: (message: string, error?: boolean) => void; onLogout: () => void; open: (modal: ModalState) => void }) {
  const [photo, setPhoto] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  async function loadPhoto(file?: File) {
    if (!file) return;
    setPhotoBusy(true);
    try { setPhoto(await compressImage(file)); } catch (error) { notify(error instanceof Error ? error.message : "照片处理失败", true); } finally { setPhotoBusy(false); }
  }
  async function formAction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form.entries());
    let payload: Record<string, unknown>;
    if (modal.type === "reject") payload = { action: "review_task", taskId: modal.task.id, decision: "reject", reason: values.reason };
    else if (modal.type === "cheer") payload = { action: "send_cheer", text: values.text, emoji: values.emoji };
    else if (modal.type === "medal") payload = { action: "grant_medal", reason: values.reason };
    else if (modal.type === "adjust") payload = { action: "adjust_drops", delta: values.delta, reason: values.reason };
    else if (modal.type === "reward") payload = { action: "add_reward", title: values.title, description: values.description, emoji: values.emoji, cost: values.cost };
    else if (modal.type === "edit") payload = { action: "edit_task", taskId: modal.task.id, ml: values.ml, cups: values.cups, emoji: values.emoji, loveNote: values.loveNote, miniTask: values.miniTask };
    else return;
    if (await act(payload)) close();
  }
  if (modal.type === "photoView") return <div className="photo-viewer" onMouseDown={close}><button className="photo-viewer-close" onClick={close}><Icon name="close"/></button><img src={modal.url} alt={modal.caption ?? "照片"}/>{modal.caption && <p>{modal.caption}</p>}</div>;
  if (modal.type === "photo") return <div className="modal-backdrop" onMouseDown={close}><section className="dialog photo-dialog" onMouseDown={(e) => e.stopPropagation()}><button className="dialog-close" onClick={close}><Icon name="close"/></button><span className="dialog-kicker">{modal.kind === "start" ? "BEFORE PHOTO" : "AFTER PHOTO"}</span><h2>{modal.kind === "start" ? "先拍下满满的这一杯" : "给空杯留个纪念"}</h2><p>{modal.kind === "start" ? "请让杯子和水位都清晰入镜，之后要对比哦。" : "尽量使用同一角度、同一只杯子。"}</p><label className={`photo-picker ${photo ? "has-photo" : ""}`}>{photo ? <img src={photo} alt="即将上传的照片"/> : <><span><Icon name="camera" size={31}/></span><b>{photoBusy ? "正在压缩照片…" : "点击拍照或选择照片"}</b><small>上传前会自动压缩，最长边 1280px</small></>}<input type="file" accept="image/*" capture="environment" onChange={(e) => void loadPhoto(e.target.files?.[0])}/></label><button disabled={!photo || busy || photoBusy} className="primary-button dialog-submit" onClick={async () => { const ok = await act({ action: modal.kind === "start" ? "accept_task" : "submit_task", taskId: modal.task.id, photo }); if (ok) close(); }}>{modal.kind === "start" ? "星人已就位，开始咕嘟" : "提交给发送机认证"}</button></section></div>;
  if (modal.type === "skip") return <div className="modal-backdrop" onMouseDown={close}><section className="dialog confirm-dialog" onMouseDown={(e) => e.stopPropagation()}><span className="dialog-medal"><Icon name="medal" size={34}/></span><h2>要使用免死金牌吗？</h2><p>这杯会直接跳过，不增加也不扣除小水滴。当前库存 <b>{data.medals}</b> 张。</p><div className="dialog-buttons"><button className="secondary-button" onClick={close}>再坚持一下</button><button className="gold-button" disabled={busy || data.medals < 1} onClick={async () => { if (await act({ action: "skip_task", taskId: modal.task.id })) close(); }}>确认使用</button></div></section></div>;
  if (modal.type === "logout") return <div className="modal-backdrop" onMouseDown={close}><section className="dialog confirm-dialog" onMouseDown={(e) => e.stopPropagation()}><span className="dialog-danger-icon"><Icon name="logout" size={32}/></span><h2>要离开这颗星球吗？</h2><p>退出后需要<b>重新输入配对码</b>才能回到这颗星球。<br/>星球的记忆和照片都会保留，请放心。</p><div className="dialog-buttons"><button className="secondary-button" onClick={close}>先不走了</button><button className="gold-button" disabled={busy} onClick={async () => { close(); await onLogout(); }}>确认退出</button></div></section></div>;
  if (modal.type === "pwa") return <div className="modal-backdrop" onMouseDown={close}><section className="dialog pwa-dialog" onMouseDown={(e) => e.stopPropagation()}><button className="dialog-close" onClick={close}><Icon name="close"/></button><div className="pwa-icon-showcase"><img src="/apple-touch-icon.png" alt="咕嘟星球主屏幕图标" width={76} height={76}/><div><span className="eyebrow-chip">STANDALONE APP</span><h3>咕嘟星球</h3><p>深海蓝底 · 清透水滴星球 · 伴心光轨</p></div></div><div className="pwa-guide-steps"><div className="pwa-step"><b>iPhone (Safari)</b><span>点击底部工具栏中间的 <strong>分享图标 (方框带箭头 ↑)</strong> → 往下滑选择 <strong>「添加到主屏幕」</strong> → 点右上角「添加」。</span></div><div className="pwa-step"><b>Android (Chrome / 夸克)</b><span>点击浏览器右上角 <strong>「⋮」菜单</strong> → 选择 <strong>「添加到主屏幕」</strong> 或 <strong>「安装应用」</strong>。</span></div></div><button className="primary-button dialog-submit" onClick={close}>知道了，这就收藏到桌面</button></section></div>;
  if (modal.type === "taskDetail") {
    const task = modal.task;
    return <div className="modal-backdrop" onMouseDown={close}><section className="dialog detail-dialog" onMouseDown={(e) => e.stopPropagation()}><button className="dialog-close" onClick={close}><Icon name="close"/></button><span className="dialog-kicker">TASK DETAIL{task.kind === "daily" ? " · DAILY" : ""}</span><h2>这杯水的故事</h2><div className="detail-head"><span className="detail-mood"><MoodIcon emoji={task.emoji} size={46}/></span><div><b>{task.ml}ml × {task.cups} 杯</b><div className="detail-badges">{task.kind === "daily" && <span className="daily-tag">日常</span>}<StatusBadge status={task.status}/></div></div></div>{task.loveNote && <blockquote>“{task.loveNote}”</blockquote>}{task.miniTask && <div className="mini-task"><Icon name="sparkle" size={15}/><span>附加任务：{task.miniTask}</span></div>}<div className="detail-timeline"><div><i/><span><b>发出</b><small>{formatClock(task.createdAt)}</small></span></div><div><i/><span><b>接受</b><small>{formatClock(task.acceptedAt)}</small></span></div><div><i/><span><b>提交</b><small>{formatClock(task.submittedAt)}</small></span></div><div><i/><span><b>认证</b><small>{formatClock(task.reviewedAt)}</small></span></div></div>{task.rejectReason && <p className="detail-note">驳回原因：{task.rejectReason}</p>}{task.failReason && <p className="detail-note">未完成原因：{task.failReason}</p>}{(task.startPhotoUrl || task.endPhotoUrl) ? <div className="detail-photos">{task.startPhotoUrl && <figure onClick={() => open({ type: "photoView", url: task.startPhotoUrl!, caption: "开始喝之前" })}><img src={task.startPhotoUrl} alt="开始喝之前"/><figcaption>开始 · BEFORE</figcaption></figure>}{task.endPhotoUrl && <figure onClick={() => open({ type: "photoView", url: task.endPhotoUrl!, caption: "喝完之后" })}><img src={task.endPhotoUrl} alt="喝完之后"/><figcaption>喝完 · AFTER</figcaption></figure>}</div> : <p className="detail-note muted">没有留下照片记录。</p>}</section></div>;
  }
  const config = modal.type === "reject" ? { kicker: "RETAKE NEEDED", title: "告诉星人哪里需要重拍", button: "退回重拍" } : modal.type === "cheer" ? { kicker: "A LITTLE LOVE", title: "说一句鼓励", button: "送到星人身边" } : modal.type === "medal" ? { kicker: "A DAY OFF", title: "发一张免死金牌", button: "发放金牌" } : modal.type === "adjust" ? { kicker: "MANUAL LEDGER", title: "调整小水滴", button: "确认记一笔" } : modal.type === "edit" ? { kicker: "EDIT COMMAND", title: "修改这杯水", button: "保存指令" } : { kicker: "NEW REWARD", title: "上架一份新奖品", button: "放进奖品柜" };
  return <div className="modal-backdrop" onMouseDown={close}><form className="dialog form-dialog" onSubmit={formAction} onMouseDown={(e) => e.stopPropagation()}><button type="button" className="dialog-close" onClick={close}><Icon name="close"/></button><span className="dialog-kicker">{config.kicker}</span><h2>{config.title}</h2>{modal.type === "reject" && <label>驳回原因<textarea name="reason" required autoFocus placeholder="例如：水位看起来没有变化" maxLength={240}/></label>}{modal.type === "cheer" && <><div className="emoji-row dialog-emoji">{["💕", "🌷", "🥰", "✨"].map((item) => <label key={item}><input type="radio" name="emoji" value={item} defaultChecked={item === "💕"}/><span>{item}</span></label>)}</div><label>想说的话<textarea name="text" required autoFocus placeholder="小口慢慢喝，我会一直陪着你。" maxLength={240}/></label><div className="preset-column">{cheerPresets.map((item) => <button type="button" key={item} onClick={(e) => { const form = e.currentTarget.closest("form"); const area = form?.querySelector<HTMLTextAreaElement>('textarea[name="text"]'); if (area) area.value = item; }}>{item}</button>)}</div></>}{modal.type === "medal" && <label>发放备注 <small>选填</small><input name="reason" autoFocus placeholder="今天辛苦啦，放个小假" maxLength={160}/></label>}{modal.type === "adjust" && <><label>增减数量<input name="delta" type="number" required autoFocus min={-50} max={50} placeholder="例如：2 或 -1"/></label><label>备注<input name="reason" required placeholder="例如：今天生病，额外奖励" maxLength={200}/></label><p className="dialog-hint">小水滴最低为 0，不会扣成负数。</p></>}{modal.type === "reward" && <><div className="split-fields"><label>图标<input name="emoji" defaultValue="🎁" maxLength={8}/></label><label>所需水滴<input name="cost" type="number" defaultValue={20} min={1} max={999}/></label></div><label>奖品名称<input name="title" required autoFocus placeholder="一起看一场电影" maxLength={120}/></label><label>简单说明<input name="description" placeholder="时间地点由星人决定" maxLength={240}/></label></>}{modal.type === "edit" && <><div className="edit-task-fields"><label>毫升<input name="ml" type="number" defaultValue={modal.task.ml} min={50} max={3000} required autoFocus/></label><label>杯数<input name="cups" type="number" defaultValue={modal.task.cups} min={1} max={10} required/></label></div><div className="emoji-row dialog-emoji">{(["💧", "💕", "😤", "👑"] as const).map((item) => <label key={item}><input type="radio" name="emoji" value={item} defaultChecked={modal.task.emoji === item}/><span><MoodIcon emoji={item} size={30}/></span></label>)}</div><label>情话<input name="loveNote" defaultValue={modal.task.loveNote ?? ""} maxLength={240} placeholder="喝完这杯，今天也要甜甜的。"/></label><label>附加任务<input name="miniTask" defaultValue={modal.task.miniTask ?? ""} maxLength={240} placeholder="例如：喝的时候看我一眼"/></label><p className="dialog-hint">修改不会延长原来的接受时限。</p></>}<button disabled={busy} className="primary-button dialog-submit" type="submit">{config.button}</button></form></div>;
}

export default function GuduApp() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [tab, setTab] = useState("home");
  const [modal, setModal] = useState<ModalState>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; error: boolean } | null>(null);

  const notify = useCallback((message: string, error = false) => setToast({ message, error }), []);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 2800); return () => window.clearTimeout(timer); }, [toast]);

  const refresh = useCallback(async (silent = false) => {
    try {
      const response = await fetch("/api/app", { cache: "no-store" });
      if (!response.ok) throw new Error("信号暂时中断");
      setSnapshot(await response.json() as Snapshot);
    } catch (error) {
      if (!silent) notify(error instanceof Error ? error.message : "加载失败", true);
    }
  }, [notify]);

  const manualRefresh = useCallback(async (alreadyPaired: boolean) => {
    try {
      const response = await fetch("/api/app", { cache: "no-store" });
      if (!response.ok) throw new Error("信号暂时中断");
      const next = await response.json() as Snapshot;
      setSnapshot(next);
      if (next.authenticated && !next.paired) {
        notify("还没看到星人降落…再等等 TA");
      } else if (next.authenticated && next.paired && !alreadyPaired) {
        notify("星人已降落，星球亮起来啦");
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : "加载失败", true);
    }
  }, [notify]);

  useEffect(() => { void refresh(); const timer = window.setInterval(() => void refresh(true), 3000); return () => window.clearInterval(timer); }, [refresh]);

  const act = useCallback(async (payload: Record<string, unknown>) => {
    setBusy(true);
    try {
      const response = await fetch("/api/app", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as { ok?: boolean; error?: string; message?: string };
      if (!response.ok) throw new Error(result.error || "操作失败");
      if (result.message) notify(result.message);
      await refresh(true);
      return true;
    } catch (error) {
      notify(error instanceof Error ? error.message : "操作失败", true);
      return false;
    } finally { setBusy(false); }
  }, [notify, refresh]);

  async function logout() {
    await act({ action: "logout" });
    setSnapshot({ authenticated: false }); setTab("home");
  }

  if (!snapshot) return <div className="loading-screen"><span className="loading-drop"><Icon name="drop" size={30}/></span><b>正在接收星球信号</b><i/></div>;
  if (!snapshot.authenticated) return <><SetupScreen onReady={() => refresh()} notify={notify}/>{toast && <div className={`toast ${toast.error ? "toast-error" : ""}`}>{toast.error ? "!" : "✓"}<span>{toast.message}</span></div>}</>;
  if (snapshot.role === "sender" && !snapshot.paired) return <><WaitingScreen data={snapshot} onRefresh={manualRefresh} open={setModal} notify={notify}/>{modal && <Dialog key={`${modal.type}-${"task" in modal ? modal.task.id : "new"}`} modal={modal} data={snapshot} busy={busy} close={() => setModal(null)} act={act} notify={notify} onLogout={() => void logout()} open={setModal}/>}{toast && <div className={`toast ${toast.error ? "toast-error" : ""}`}>{toast.error ? "!" : "✓"}<span>{toast.message}</span></div>}</>;

  const reviewCount = snapshot.tasks.filter((task) => task.status === "pending_review").length;
  return <main className="app-background"><div className="desktop-note"><span className="brand-mark"><Icon name="drop" size={18}/></span><p>一颗只有两个人<br/>知道坐标的小星球。</p><small>GUDU PLANET · PRIVATE ORBIT</small></div><section className="phone-shell"><AppHeader data={snapshot} open={setModal}/><div className="app-scroll">
    {snapshot.role === "sender" && tab === "home" && <SenderHome data={snapshot} navigate={setTab} open={setModal} act={act}/>} 
    {snapshot.role === "sender" && tab === "send" && <SendTab act={act} navigate={setTab}/>} 
    {snapshot.role === "sender" && tab === "review" && <ReviewTab data={snapshot} act={act} open={setModal}/>} 
    {tab === "diary" && <DiaryTab data={snapshot} open={setModal}/>} 
    {snapshot.role === "sender" && tab === "rewards" && <SenderRewards data={snapshot} act={act} open={setModal}/>} 
    {snapshot.role === "star" && tab === "home" && <StarHome data={snapshot} open={setModal}/>} 
    {snapshot.role === "star" && tab === "tasks" && <StarTasks data={snapshot} open={setModal}/>} 
    {snapshot.role === "star" && tab === "exchange" && <ExchangeTab data={snapshot} act={act}/>} 
  </div><BottomNav role={snapshot.role} active={tab} setActive={setTab} reviewCount={reviewCount}/></section>{modal && <Dialog key={`${modal.type}-${"task" in modal ? modal.task.id : "new"}`} modal={modal} data={snapshot} busy={busy} close={() => setModal(null)} act={act} notify={notify} onLogout={() => void logout()} open={setModal}/>} {toast && <div className={`toast ${toast.error ? "toast-error" : ""}`}>{toast.error ? "!" : "✓"}<span>{toast.message}</span></div>} {busy && <div className="busy-line"/>}</main>;
}
