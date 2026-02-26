# 每日鼓励话语定时任务配置

`daily-encouragement` Edge Function 已迁移至 Dify 工作流，需配置 `DIFY_API_KEY` 和 `CRON_SECRET`。

支持每 24 小时一次或每 4 小时一次（每天 6 次）。

## 方案一：外部 Cron 服务（推荐 MVP）

使用 [cron-job.org](https://cron-job.org) 或 [EasyCron](https://www.easycron.com) 等免费服务：

1. 在 Supabase Dashboard 的 Edge Functions Secrets 中配置 `CRON_SECRET`（随机字符串）
2. 在 Cron 服务中创建任务：
   - **每 24 小时**：如每天 8:00，cron 表达式 `0 8 * * *`
   - **每 4 小时（每天 6 次）**：cron 表达式 `0 */4 * * *`
   - URL: `https://<project-ref>.supabase.co/functions/v1/daily-encouragement`
   - Method: POST
   - Header: `Authorization: Bearer <CRON_SECRET>`

## 方案二：Supabase pg_cron（Pro 计划）

若使用 Supabase Pro，可在 SQL Editor 中执行。完整 SQL 见 [CRON_SQL_6x_DAILY.sql](./CRON_SQL_6x_DAILY.sql)。

**每天 6 次（每 4 小时）示例**：

```sql
SELECT cron.schedule(
  'daily-encouragement-6x',
  '0 */4 * * *',  -- 0:00, 4:00, 8:00, 12:00, 16:00, 20:00 UTC
  $$
  SELECT net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/daily-encouragement',
    body := '{}'::jsonb,
    params := '{}'::jsonb,
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <CRON_SECRET>"}'::jsonb
  );
  $$
);
```

## 方案三：阿里云函数计算 + 定时触发器

在阿里云创建函数计算，配置定时触发器每日调用 Edge Function URL。
