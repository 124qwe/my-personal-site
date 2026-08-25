"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ambient, Toasts, type Toast } from "@/components/Ambient";
import { Reveal, StickerChip } from "@/components/Bits";

export function Onboarding({ inviteCode = "" }: { inviteCode?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"create" | "join">(
    inviteCode ? "join" : "create",
  );
  const [herName, setHerName] = useState("");
  const [hisName, setHisName] = useState("");
  const [code, setCode] = useState(inviteCode);
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

  const pushToast = (text: string, tone: Toast["tone"] = "bad") =>
    setToasts([{ id: Date.now(), text, tone }]);

  const submit = async () => {
    setBusy(true);
    setLastError(null);
    try {
      const res = await fetch("/api/couple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "create"
            ? { mode, herName: herName.trim(), hisName: hisName.trim() }
            : { mode, code: code.trim(), nickname: nickname.trim() },
        ),
      });

      // 尝试解析 JSON，失败则读文本
      let data: any = {};
      let text = "";
      try {
        data = await res.clone().json();
      } catch {
        text = await res.text().catch(() => "");
      }

      if (!res.ok) {
        const msg = data?.error || text?.slice(0, 200) || `请求失败 ${res.status}`;
        throw new Error(msg);
      }
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "没成功，再试一次";
      setLastError(msg);
      pushToast(msg);
      // 控制台也打一份，方便你 F12 看
      console.error("[创建失败]", e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <Ambient />
      <Toasts items={toasts} />

      <div className="mx-auto flex min-h-dvh max-w-[460px] flex-col justify-center px-5 py-10">
        <Reveal>
          <div className="mb-6 flex items-center gap-3">
            <span
              className="sticker animate-wobble overflow-hidden bg-white"
              style={{ width: 52, height: 52 }}
            >
              <img
                src="/hellokitty/9.png"
                alt="Hello Kitty"
                width={52}
                height={52}
                className="h-full w-full object-cover"
              />
            </span>
            <div>
              <h1 className="font-display text-[30px] leading-none text-ink">贴画铺子</h1>
              <p className="mt-1 text-[12.5px] text-ink-3">
                两个人的贴画奖罚账本 · 攒 20 张许一个愿望
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={90}>
          <div className="card overflow-hidden">
            <div className="grid grid-cols-2 border-b-2 border-ink/85">
              {(
                [
                  { key: "create", label: "我是她 · 开账本", icon: "🎀" },
                  { key: "join", label: "用码进入 · 换设备", icon: "🔑" },
                ] as const
              ).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setMode(t.key)}
                  className="flex items-center justify-center gap-1.5 py-3.5 text-[13.5px] font-medium transition-colors"
                  style={{
                    background: mode === t.key ? "#2b1a21" : "#fffbf3",
                    color: mode === t.key ? "#fdf3e4" : "#55404a",
                  }}
                >
                  <span>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="space-y-4 p-5">
              {mode === "create" ? (
                <>
                  <p className="text-[13px] leading-relaxed text-ink-2">
                    你来当贴画管理员：<strong className="text-berry">奖励和扣除都由你说了算</strong>。
                    创建后会得到一个邀请码，发给他就能共用同一本账。
                  </p>
                  <label className="block">
                    <span className="text-[12.5px] font-medium text-ink-2">你的昵称</span>
                    <input
                      value={herName}
                      maxLength={12}
                      onChange={(e) => setHerName(e.target.value)}
                      placeholder="例如：小美 / 领导"
                      className="mt-1 w-full rounded-xl border-2 border-ink/20 bg-[#fffaf1] px-3 py-3 text-[15px]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[12.5px] font-medium text-ink-2">他的昵称</span>
                    <input
                      value={hisName}
                      maxLength={12}
                      onChange={(e) => setHisName(e.target.value)}
                      placeholder="例如：阿呆 / 大宝贝"
                      className="mt-1 w-full rounded-xl border-2 border-ink/20 bg-[#fffaf1] px-3 py-3 text-[15px]"
                    />
                  </label>
                </>
              ) : (
                <>
                  <p className="text-[13px] leading-relaxed text-ink-2">
                    输入 6 位码进入同一本账。
                    <strong className="text-dye">他用邀请码</strong>进来负责攒贴画和许愿；
                    <strong className="text-berry">她用自己的登录码</strong>进来还是管理员，
                    可以在手机、平板上同时用。
                  </p>
                  <label className="block">
                    <span className="text-[12.5px] font-medium text-ink-2">
                      邀请码 / 登录码
                    </span>
                    <input
                      value={code}
                      maxLength={8}
                      autoCapitalize="characters"
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="6 位字母数字"
                      className="num mt-1 w-full rounded-xl border-2 border-ink/85 bg-[#fffaf1] px-3 py-3 text-center text-[24px] font-bold tracking-[0.35em] text-ink"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[12.5px] font-medium text-ink-2">
                      你的昵称<span className="text-ink-3">（她登录时可留空）</span>
                    </span>
                    <input
                      value={nickname}
                      maxLength={12}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="留空就用她给你取的那个"
                      className="mt-1 w-full rounded-xl border-2 border-ink/20 bg-[#fffaf1] px-3 py-3 text-[15px]"
                    />
                  </label>
                </>
              )}

              {lastError ? (
                <div className="rounded-xl bg-berry/10 px-3 py-2.5 text-[12.5px] leading-relaxed text-berry-deep">
                  <p className="font-medium">创建失败：{lastError}</p>
                  {lastError.includes("DATABASE_URL") || lastError.includes("表还没建") ? (
                    <p className="mt-1 text-[11.5px] text-ink-2">
                      本地请先：<code className="rounded bg-black/10 px-1">cp .env.example .env</code>{" "}
                      然后 <code className="rounded bg-black/10 px-1">docker compose up -d</code> 再{" "}
                      <code className="rounded bg-black/10 px-1">node scripts/bootstrap-db.mjs</code>
                    </p>
                  ) : null}
                </div>
              ) : null}

              <button
                type="button"
                disabled={busy}
                onClick={submit}
                className="btn-hard animate-sheen relative w-full overflow-hidden rounded-xl bg-berry py-4 font-display text-[19px] text-[#fff8ee]"
              >
                {busy
                  ? "正在开门…"
                  : mode === "create"
                    ? "创建我们的小账本"
                    : "进入账本"}
              </button>
            </div>
          </div>
        </Reveal>

        <Reveal delay={160}>
          <div className="mt-5 flex items-center justify-center gap-2 opacity-80">
            {["🌟", "🍓", "🐻", "🌈", "💌", "🏆"].map((i, n) => (
              <StickerChip
                key={i}
                icon={i}
                size={34}
                rotate={((n * 47) % 24) - 12}
                cut={n % 3 === 0}
              />
            ))}
          </div>
          <p className="mt-4 text-center text-[12px] leading-relaxed text-ink-3">
            数据只属于你们两个人
          </p>
        </Reveal>
      </div>
    </div>
  );
}
