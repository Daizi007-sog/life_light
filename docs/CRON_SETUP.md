# 每日鼓励话语定时任务配置

`daily-encouragement` Edge Function 需每 24 小时执行一次，为所有用户生成鼓励语。

## 方案一：外部 Cron 服务（推荐 MVP）

使用 [cron-job.org](https://cron-job.org) 或 [EasyCron](https://www.easycron.com) 等免费服务：

1. 在 Supabase Dashboard 的 Edge Functions 中，为 `daily-encouragement` 设置环境变量 `CRON_SECRET`（随机字符串）
2. 在 Cron 服务中创建每日任务（如每天 8:00）：
   - URL: `https://<project-ref>.supabase.co/functions/v1/daily-encouragement`
   - Method: POST
   - Header: `Authorization: Bearer <CRON_SECRET>`

## 方案二：Supabase pg_cron（Pro 计划）

若使用 Supabase Pro，可在 SQL Editor 中执行：

```sql
SELECT cron.schedule(
  'daily-encouragement',
  '0 8 * * *',  -- 每天 8:00 UTC
  $$
  SELECT net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/daily-encouragement',
    headers := '{"Authorization": "Bearer <CRON_SECRET>"}'::jsonb
  );
  $$
);
```

## 方案三：阿里云函数计算 + 定时触发器

在阿里云创建函数计算，配置定时触发器每日调用 Edge Function URL。
