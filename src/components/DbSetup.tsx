"use client";

import { useState } from "react";

export function DbSetup({ message }: { message: string }) {
  const [copied, setCopied] = useState(false);
  const example = "DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db";

  return (
    <div className="min-h-dvh bg-[#fdf3e4] px-5 py-10 text-[#2b1a21]">
      <div className="mx-auto max-w-[560px]">
        <div className="card p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="sticker" style={{ width: 44, height: 44, fontSize: 22 }}>
              🛠️
            </span>
            <h1 className="font-display text-[24px] leading-tight">数据库还没连上</h1>
          </div>

          <p className="text-[13.5px] leading-relaxed text-[#55404a]">
            这就是你截图里 <code className="rounded bg-black/10 px-1">DATABASE_URL is required</code>{" "}
            的原因：应用启动时找不到数据库地址。
          </p>

          <pre className="mt-4 max-h-[220px] overflow-auto rounded-xl bg-[#2b1a21] p-3 text-[11.5px] leading-relaxed text-[#fdf3e4]">
            {message}
          </pre>

          <div className="mt-5 space-y-3">
            <h2 className="font-display text-[18px]">本地最快修法（3 步）</h2>
            <ol className="list-decimal space-y-2 pl-5 text-[13.5px] leading-relaxed text-[#55404a]">
              <li>
                复制环境变量文件：
                <code className="ml-1 rounded bg-black/10 px-1">cp .env.example .env</code>
              </li>
              <li>
                用 Docker 一键起数据库（已配好）：
                <code className="ml-1 rounded bg-black/10 px-1">docker compose up -d</code>
                <br />
                <span className="text-[12px] text-[#8a7280]">
                  没装 Docker？本地装个 Postgres 也行，改 .env 里的地址就行。
                </span>
              </li>
              <li>
                建表 + 启动：
                <div className="mt-1 flex gap-2">
                  <code className="flex-1 rounded bg-black/10 px-2 py-1 text-[12px]">
                    node scripts/bootstrap-db.mjs && npm run dev
                  </code>
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(
                        "node scripts/bootstrap-db.mjs && npm run dev",
                      );
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                    className="rounded-lg border-2 border-[#2b1a21] px-2 py-1 text-[12px]"
                  >
                    {copied ? "已复制" : "复制"}
                  </button>
                </div>
              </li>
            </ol>
          </div>

          <div className="mt-6 rounded-xl border-2 border-dashed border-[#2b1a21]/25 bg-[#fffbf3] p-3">
            <p className="text-[12.5px] font-medium">.env 应该长这样：</p>
            <code className="mt-1 block rounded bg-[#2b1a21] px-3 py-2 text-[12px] text-[#fdf3e4]">
              {example}
            </code>
          </div>

          <div className="mt-6">
            <h2 className="font-display text-[18px]">线上部署</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-[#55404a]">
              在 Vercel / Railway 的 Environment Variables 里加{" "}
              <code className="rounded bg-black/10 px-1">DATABASE_URL</code>，用 Neon
              的 <strong>pooled</strong> 连接串（带 <code>-pooler</code> 的那个），并勾选所有环境
              Production / Preview / Development。
            </p>
          </div>

          <p className="mt-6 text-center text-[11.5px] text-[#8a7280]">
            改好 .env 后刷新页面即可，不用重装依赖
          </p>
        </div>
      </div>
    </div>
  );
}
