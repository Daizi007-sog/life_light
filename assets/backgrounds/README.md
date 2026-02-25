# 首页背景图

将首页每日随机展示的背景图放入此目录。

## 支持格式

- `.jpg` / `.jpeg`
- `.png`
- `.webp`

## 上传到 Supabase

1. 确保已配置 `.env.local`：
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
   （Service Role Key 在 Supabase Dashboard → Settings → API 中获取）

2. 执行上传：
   ```bash
   npm run upload-backgrounds
   ```

3. 若 bucket 未创建，需先在 Supabase Dashboard → Storage 中创建 `life_main_backgrounds`（设为 Public），或由脚本自动创建。

## 建议

- 图片尺寸建议 1080×1920 或类似竖屏比例，适配移动端
- 首页会叠加暗色渐变遮罩，保证文字可读性
