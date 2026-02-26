# 生命之光 - 基督徒灵修助手

基于 Supabase 的移动端灵修助手 MVP，支持经文卡片制作、鼓励话语、经文解读等功能。

## 技术栈

- 前端：HTML5 + CSS3 + JavaScript（无构建）
- 后端：Supabase（Auth、Database、Storage、Edge Functions）
- 部署：Nginx + 阿里云 ECS

## 快速开始

### 1. 配置 Supabase

1. 在 [Supabase](https://supabase.com) 创建项目
2. **关闭邮箱确认**：Authentication → Providers → Email → Confirm email 设为 **OFF**（否则注册会报 422，详见 [docs/SUPABASE_AUTH_SETUP.md](docs/SUPABASE_AUTH_SETUP.md)）
3. 在 SQL Editor 中依次执行 `supabase/migrations/` 下的 SQL 文件
3. 在 Storage 中创建 bucket：`card-images`、`interpretation-images`（可选）、`life_main_backgrounds`（首页背景图，需设为 Public）
4. 在 Edge Functions 中部署三个函数，并配置环境变量：
   - `DIFY_API_KEY`（Dify 工作流 API Key，在 Edge Functions Secrets 中配置）
   - `CRON_SECRET`（仅 daily-encouragement，用于定时任务鉴权）

### 2. 配置前端

编辑 `js/config.js`，填入 Supabase 项目 URL 和 anon key：

```js
window.__ENV__ = {
    VITE_SUPABASE_URL: 'https://xxx.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'your-anon-key',
};
```

### 3. 本地运行

使用任意静态服务器，例如：

```bash
npx serve .
# 或
python -m http.server 8080
```

访问 http://localhost:3000（或对应端口）

### 4. 部署

参见 [docs/DEPLOY.md](docs/DEPLOY.md)

## 项目结构

```
life_light/
├── index.html
├── css/           # 样式
├── js/            # 脚本
├── pages/         # 页面逻辑
├── assets/        # 静态资源
├── templates/     # 卡片模板配置
├── supabase/
│   ├── migrations/    # 数据库迁移
│   └── functions/     # Edge Functions
├── nginx/         # Nginx 配置
└── docs/          # 文档
```

## 首页背景图

首页每日随机展示一张背景图，图片来自 Supabase Storage 的 `life_main_backgrounds` bucket。

1. 将图片放入 `assets/backgrounds/`（支持 jpg、png、webp）
2. 配置 `.env.local` 中的 `SUPABASE_SERVICE_ROLE_KEY`
3. 执行 `npm run upload-backgrounds` 上传

详见 [assets/backgrounds/README.md](assets/backgrounds/README.md)

## 定时任务

每日鼓励话语需配置 Cron，详见 [docs/CRON_SETUP.md](docs/CRON_SETUP.md)
