-- 每日 6 次（每 4 小时）自动触发 daily-encouragement
-- 适用：Supabase Pro 计划（需启用 pg_cron + pg_net 扩展）
-- 执行前请替换：
--   1. <project-ref> 为你的 Supabase 项目 ID（如 bhxfpkcfbwxlnziepikw）
--   2. <CRON_SECRET> 为在 Edge Functions Secrets 中配置的 CRON_SECRET 值

-- 若尚未启用扩展（需 Supabase Pro）：
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'daily-encouragement-6x',
  '0 */4 * * *',  -- 每天 0:00, 4:00, 8:00, 12:00, 16:00, 20:00 UTC
  $$
  SELECT net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/daily-encouragement',
    body := '{}'::jsonb,
    params := '{}'::jsonb,
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <CRON_SECRET>"}'::jsonb
  );
  $$
);

-- 查看已创建的 cron 任务：
-- SELECT * FROM cron.job;

-- 删除任务（如需）：
-- SELECT cron.unschedule('daily-encouragement-6x');
