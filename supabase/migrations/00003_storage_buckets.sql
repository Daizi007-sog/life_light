-- Storage Bucket 策略
-- 需先在 Supabase Dashboard -> Storage 中创建 bucket: card-images, interpretation-images
-- 创建后执行本文件以添加访问策略

-- 允许认证用户上传卡片图片
CREATE POLICY "Authenticated users can upload card images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'card-images');

-- 允许认证用户上传解读图片
CREATE POLICY "Authenticated users can upload interpretation images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'interpretation-images');

-- 公开读取卡片图片
CREATE POLICY "Public read for card images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'card-images');

-- 公开读取解读图片
CREATE POLICY "Public read for interpretation images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'interpretation-images');
