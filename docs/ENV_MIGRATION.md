# 环境变量迁移说明（DeepSeek/OpenAI → Dify）

## 已移除的配置

- `DEEPSEEK_API_KEY`
- `OPENAI_API_KEY`
- `DASHSCOPE_API_KEY`

## 新配置（Supabase Edge Functions Secrets）

在 **Supabase Dashboard → Project Settings → Edge Functions → Secrets** 中配置：

| 变量名 | 说明 | 必填 |
|-------|------|------|
| `DIFY_API_KEY` | Dify 工作流 API Key | ✅ |
| `DIFY_SCRIPTURE_CARD_API_KEY` | 经文卡片专用（可选，不填则用 DIFY_API_KEY） | ❌ |
| `DIFY_SCRIPTURE_INTERPRET_API_KEY` | 经文解读专用（可选） | ❌ |
| `CRON_SECRET` | 每日鼓励定时任务鉴权 | 使用 Cron 时必填 |

## .env.local（Next.js 本地开发）

`.env.local` 仅用于 Next.js 前端，**不包含** Dify API Key。Dify 调用均在 Supabase Edge Functions 服务端完成。

若 `.env.local` 中存在 `DEEPSEEK_API_KEY`、`OPENAI_API_KEY` 等旧变量，请删除。

当前 `.env.local` 应包含：
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
