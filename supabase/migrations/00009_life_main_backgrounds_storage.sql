-- 首页背景图 Storage 策略
-- 需先在 Supabase Dashboard -> Storage 中创建 bucket: life_main_backgrounds（设为 Public）
-- 创建后执行本文件以添加公开读取策略

-- 公开读取首页背景图
CREATE POLICY "Public read for life main backgrounds"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'life_main_backgrounds');
