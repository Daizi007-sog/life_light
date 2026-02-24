# 生命之光 - 基督徒灵修助手

基于 Supabase 的移动端灵修助手 MVP，支持经文卡片制作、鼓励话语、经文解读等功能。

## 技术栈

- 前端：HTML5 + CSS3 + JavaScript（无构建）
- 后端：Supabase（Auth、Database、Storage、Edge Functions）
- 部署：Nginx + 阿里云 ECS

## 快速开始

### 1. 配置 Supabase

1. 在 [Supabase](https://supabase.com) 创建项目
2. 在 SQL Editor 中依次执行 `supabase/migrations/` 下的 SQL 文件
3. 在 Storage 中创建 bucket：`card-images`、`interpretation-images`（可选）
4. 在 Edge Functions 中部署三个函数，并配置环境变量：
   - `OPENAI_API_KEY` 或 `DASHSCOPE_API_KEY`（LLM API）
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

## 定时任务

每日鼓励话语需配置 Cron，详见 [docs/CRON_SETUP.md](docs/CRON_SETUP.md)
