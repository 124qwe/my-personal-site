# 贴画铺子 · 我们的小账本

> 两个人的贴画奖罚账本 · 攒 20 张许一个愿望

一款只属于两个人的 Web 应用。她是**贴画管理员**,负责发贴画、扣贴画、审批愿望;他是**攒贴画的人**,看着自己那一摞贴画,把想做的事写进许愿池。
账本、贴画墙、愿望池,都在同一对眼睛里 —— 装不装得下,试试就知道。

---

## ✨ 功能一览

| 模块 | 说明 |
| --- | --- |
| **邀请码绑定** | 她创建账本后获得 6 位邀请码,他扫码/输入码加入,看到的是同一本账 |
| **登录码自留** | 换手机、平板时用「登录码」回到管理员身份,不再担心丢账号 |
| **发贴画 / 扣贴画** | 一次最多 5 张,每笔强制写原因和时间,杜绝「他表现好」一句话糊弄过去 |
| **贴画墙** | 最近 34 张按时间钉在墙上,点一下能看到原因,违规的贴画半透明 |
| **流水账本** | 按天分组,可筛选奖励/扣除,可搜索原因,可单笔撤销(仅管理员) |
| **许愿池** | 攒够 N 张贴画可以许一个愿望,愿望要具体、可执行 |
| **愿望处理** | 兑现 / 驳回 / 改回待处理,驳回或撤回时贴画原路退回账户 |
| **双方实时同步** | 每 15 秒自动拉一次对方最新动作,不用刷新就能看到对方改了啥 |
| **移动端 Dock** | 手机端固定底栏,4 个按钮直达发贴画、账本、许愿、更多 |
| **Hello Kitty 主题装饰** | 顶栏、统计卡片、Dock、许愿池、奖励/扣除卡片全部换成 Hello Kitty 装饰图 |

---

## 🧱 技术栈

| 类别 | 选型 |
| --- | --- |
| **前端框架** | Next.js 16(App Router, `output: "standalone"`) |
| **视图层** | React 19 + TypeScript 5 |
| **样式** | Tailwind CSS v4 + 一点点手写 CSS(`纸纹`、`sticker` 阴影、`paper-grain` 等) |
| **数据库** | PostgreSQL 16(`pg` 直连,无 ORM 装饰) |
| **数据建模** | Drizzle ORM + Drizzle Kit |
| **部署形态** | Docker 多阶段构建 → `node server.js` 自包含产物 |
| **环境变量** | `dotenv`(本地) / Docker 环境变量(部署) |

依赖版本完整列表见 [`package.json`](./package.json)。

---

## 📂 目录结构

```
couple-sticker-reward-system/
├─ src/
│  ├─ app/                  # Next.js App Router
│  │  ├─ api/               # 路由处理:couple / state / stickers / wishes / settings / reset
│  │  ├─ layout.tsx         # 全局布局 + Google Fonts(ZCOOL KuaiLe + Noto Sans SC + Fraunces)
│  │  ├─ page.tsx           # 入口:未登录走 Onboarding,已登录走 Board
│  │  └─ globals.css        # paper-grain、sticker、sticker-cut、动效等
│  ├─ components/
│  │  ├─ Board.tsx          # 主页(英雄区 + 统计 + 操作台 + 贴画墙 + 账本 + 许愿池 + 公约 + Dock)
│  │  ├─ Onboarding.tsx     # 创建账本 / 用码加入
│  │  ├─ StickerForm.tsx    # 发贴画 / 扣贴画表单
│  │  ├─ Ledger.tsx         # 流水账本(按天分组 + 搜索 + 撤销)
│  │  ├─ WishWell.tsx       # 许愿池 + 愿望墙
│  │  ├─ StickerBook.tsx    # 右侧许愿进度表
│  │  ├─ Ambient.tsx        # 背景渐变 + 漂浮符号 + 贴纸雨 + Toast
│  │  ├─ Bits.tsx           # Counter(数字滚动)/ Reveal(滚动揭示)/ StickerChip / SectionTitle
│  │  └─ DbSetup.tsx        # 缺 DATABASE_URL 时的引导页
│  ├─ db/
│  │  ├─ index.ts           # pg Pool 初始化
│  │  └─ schema.ts          # couples / entries / wishes 三张表
│  └─ lib/
│     ├─ auth.ts            # cookie 会话 + DTO
│     ├─ state.ts           # /api/state 聚合:summary + entries + wishes + couple + me
│     ├─ stickers.ts        # 贴纸库、理由模板
│     ├─ ensure.ts          # 启动期幂等建表
│     ├─ format.ts          # 时间、日期、相对时间
│     ├─ http.ts            # 通用响应/异常
│     └─ types.ts           # DTO 类型
├─ public/hellokitty/       # Hello Kitty 装饰图(顶栏/统计/Dock/许愿池/奖励扣除)
├─ scripts/bootstrap-db.mjs # 启动时幂等建表
├─ Dockerfile               # 多阶段:build → standalone + node:22-alpine
├─ docker-compose.yml       # postgres:16-alpine + web(本项目)
├─ drizzle.config.json
├─ next.config.ts           # output: "standalone", poweredByHeader: false
├─ postcss.config.mjs
├─ eslint.config.mjs
├─ tsconfig.json
└─ package.json
```

---

## 🚀 快速启动(Docker,推荐)

```bash
# 1. 启动(PostgreSQL + Web)
docker compose up -d --build

# 2. 看日志,确认没报错
docker compose logs -f web
```

启动后会看到:

- PostgreSQL 健康检查通过 → 自动建表(由 `scripts/bootstrap-db.mjs` 幂等执行)
- Next.js 服务监听 `http://localhost:3000`
- 浏览器打开 → 进入「创建我们的小账本」页面

默认数据库账号:

| 字段 | 值 |
| --- | --- |
| `POSTGRES_USER` | `tiehua` |
| `POSTGRES_PASSWORD` | `please-change-this-password` |
| `POSTGRES_DB` | `tiehua` |

> ⚠️ **生产环境务必改掉默认密码**,在 `docker-compose.yml` 里改三处:`db.environment`、`web.environment.DATABASE_URL`、以及后面的密码注释。

---

## 🛠️ 本地开发(不用 Docker)

```bash
# 1. 准备 .env
cp .env.example .env
# 编辑 .env,设置 DATABASE_URL=postgresql://tiehua:xxx@localhost:5432/tiehua

# 2. 启动 Postgres(可以用 docker compose up -d db 单独起)
docker compose up -d db

# 3. 装依赖
npm install

# 4. 幂等建表
node scripts/bootstrap-db.mjs

# 5. 起 dev server
npm run dev
```

可用脚本:

| 脚本 | 作用 |
| --- | --- |
| `npm run dev` | 启动开发服务器(HMR) |
| `npm run build` | 产线构建(`output: "standalone"`) |
| `npm run start` | 运行构建产物 |
| `npm run lint` | ESLint 检查 |
| `npm run typecheck` | TypeScript 类型检查 |

---

## 🔐 关键设计

### 角色与权限

- **她(管理员 / owner)**:能发贴画、扣贴画、处理愿望、改设置、看自己登录码
- **他(攒贴画的 / joiner)**:看账、看愿望、攒够 N 张后许愿

### Cookie 会话

- 第一次创建账本:写入 `role=her` + `ownerKey` 到 cookie(管理员身份)
- 用邀请码加入:写入 `role=his` 到 cookie(加入者身份)
- 自带「登录码」(ownerKey):她换设备时凭这个码回到管理员身份

### 数据库表(`src/db/schema.ts`)

- `couples`:账本基本信息(邀请码、双方昵称、登录码、许愿门槛)
- `entries`:每一笔发贴画/扣贴画(金额、原因、贴纸、谁发的)
- `wishes`:愿望池(标题、详情、状态:待兑现/已兑现/已驳回)

所有读写都走 `/api/state` 聚合接口,保证双方看到的状态一致。

---

## 🎨 视觉风格

- **纸纹背景** + 米色基底(`#fdf3e4`)
- **贴纸**:`.sticker` 圆形阴影容器,像贴上去的实物
- **手写感字体**:`ZCOOL KuaiLe` + `Fraunces`(标题) + `Noto Sans SC`(正文)
- **Hello Kitty 装饰图**:顶栏头像、统计卡、Dock 状态栏、许愿池、奖励/扣除卡片

---

## 📦 部署

镜像走的是 `output: "standalone"`,Dockerfile 会:

1. `npm install` + `npm run build`
2. 只把 `.next/standalone` + `.next/static` 拷进运行时镜像
3. 容器启动时先跑 `scripts/bootstrap-db.mjs` 幂等建表,再 `node server.js`

部署到任意支持 Docker 的环境(VPS / 容器服务 / K8s)即可。反代建议传 `X-Forwarded-Proto`,否则在 `web.environment` 里加一行:

```yaml
COOKIE_SECURE: "1"
```

---

## 🤝 贡献与规范

- 不引入新依赖前先在 issue 里讨论,这个项目刻意保持轻
- 提交信息用中文 + 动词开头,例如「记账:增加本周统计的 SQL 索引」
- 跑 `npm run lint && npm run typecheck` 再发 PR

---

## 📄 License

本仓库以学习和个人使用为主,暂未指定开源协议。如需二次分发,请先联系作者。

---

> 数据只属于你们两个人 —— 写在 Onboarding 底下的那句话,也是这整个项目的态度。
