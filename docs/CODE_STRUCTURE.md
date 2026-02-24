# 代码结构说明（按 PRD 功能划分）

本文档将产品需求文档（PRD）中的功能与代码文件一一对应，便于维护与扩展。

---

## 一、信息收集功能

**PRD 描述**：收集用户资料，用于 AI 提供更贴合的 AIGC 内容。包含 3–5 个问卷模块，支持按钮选择或输入。

| 文件 | 职责 |
|------|------|
| `js/pages/profile.js` | 问卷渲染、选项选择、昵称输入、画像保存 |
| `js/config.js` | 问卷配置可在此扩展（当前在 profile.js 内联） |
| `supabase/migrations/00001_initial_schema.sql` | `user_profiles` 表：`questionnaire_answers`(JSONB)、`nickname` |

**数据流**：用户填写 → `profile.js` 收集 → `supabase.from('user_profiles').upsert()` → 供 Edge Functions 读取

---

## 二、登录功能

**PRD 描述**：用户名密码登录，系统记录不同用户的画像信息。

| 文件 | 职责 |
|------|------|
| `js/auth.js` | `signIn`、`signUp`、`signOut`、`getCurrentUser`、`onAuthStateChange` |
| `js/pages/login.js` | 登录/注册表单、切换模式、错误提示 |
| `js/supabase-client.js` | Supabase 客户端初始化（含 Auth） |
| `js/app.js` | 路由守卫：未登录时跳转登录页 |

**数据流**：Supabase Auth（邮箱+密码）→ Session → 各页面按 `user.id` 读写数据

---

## 三、经文卡片制作、分享功能

**PRD 描述**：结合 AIGC 和用户输入，制作个性化图文经文卡片，支持分享到社交媒体。

| 文件 | 职责 |
|------|------|
| `js/pages/scripture-card.js` | 用户输入心情 → 调用 Edge Function → 预览卡片 → 切换模板 → 保存/分享 |
| `supabase/functions/scripture-card-generate/index.ts` | 接收 `user_input`，调 LLM 返回经文+文案 |
| `templates/card-templates.json` | 卡片模板配置（id、name、image） |
| `assets/placeholder-card.svg` | 默认卡片背景图 |
| `supabase/migrations/00001_initial_schema.sql` | `scripture_cards` 表 |

**数据流**：
1. 用户输入 → Edge Function(LLM) → 返回经文
2. 前端组合模板+经文 → 用户可切换图片 DIY
3. 保存 → `scripture_cards` 表
4. 分享 → Web Share API 或复制到剪贴板

---

## 四、鼓励话语功能

**PRD 描述**：结合用户画像，每 24 小时根据 prompt 和 AIGC 自动生成鼓励文本并推送。

| 文件 | 职责 |
|------|------|
| `js/pages/encouragement.js` | 展示今日鼓励、历史记录列表 |
| `supabase/functions/daily-encouragement/index.ts` | Cron 触发，遍历 `user_profiles`，调 LLM 生成，写入 `encouragement_logs` |
| `supabase/migrations/00001_initial_schema.sql` | `encouragement_logs` 表 |
| `docs/CRON_SETUP.md` | 定时任务配置说明 |

**数据流**：Cron 每 24h → Edge Function → 读 `user_profiles` → LLM 生成 → 写入 `encouragement_logs` → 前端展示

---

## 五、经文解读功能

**PRD 描述**：根据 prompt 深度解读用户选中的经文，返回 AIGC 文本和图片。

| 文件 | 职责 |
|------|------|
| `js/pages/interpretation.js` | 经文输入框、调用 Edge Function、展示洞察/行动/背景 |
| `supabase/functions/scripture-interpret/index.ts` | 接收经文，调 LLM 返回 `insight`、`action`、`background` |

**数据流**：用户输入经文 → Edge Function(LLM) → 返回解读 → 前端分块展示

---

## 六、通用与基础设施

| 文件/目录 | 职责 |
|----------|------|
| `index.html` | 入口、viewport、导航容器 |
| `js/app.js` | 路由、导航渲染、鉴权守卫 |
| `js/supabase-client.js` | Supabase 客户端单例 |
| `js/config.js` | Supabase URL、Anon Key |
| `css/base.css` | 变量、重置、移动端基准 |
| `css/layout.css` | 布局、导航、页面容器 |
| `css/components.css` | 按钮、卡片、表单、加载态 |
| `nginx/nginx.conf` | 阿里云部署配置 |
| `Dockerfile` | Docker 镜像构建 |

---

## 七、目录树总览

```
life_light/
├── index.html
├── js/
│   ├── app.js              # 路由、初始化
│   ├── config.js           # Supabase 配置（已初始化）
│   ├── supabase-client.js  # 客户端单例
│   ├── auth.js             # 登录/登出
│   └── pages/
│       ├── login.js         # 登录页
│       ├── home.js         # 首页
│       ├── profile.js      # 用户画像/问卷
│       ├── scripture-card.js   # 经文卡片
│       ├── encouragement.js   # 鼓励话语
│       └── interpretation.js  # 经文解读
├── css/
│   ├── base.css
│   ├── layout.css
│   └── components.css
├── assets/
│   └── placeholder-card.svg
├── templates/
│   └── card-templates.json
├── supabase/
│   ├── migrations/         # 表结构、RLS、Storage 策略
│   └── functions/          # Edge Functions
├── nginx/
│   └── nginx.conf
└── docs/
    ├── CODE_STRUCTURE.md   # 本文档
    ├── CRON_SETUP.md
    └── DEPLOY.md
```
