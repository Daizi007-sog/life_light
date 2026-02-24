# 光盐旅记 - Next.js 版本

## 前置准备

### 1. Supabase 配置

1. 在 Supabase SQL Editor 中**依次执行**以下迁移：
   - `supabase/migrations/00001_initial_schema.sql`
   - `supabase/migrations/00002_rls_policies.sql`
   - `supabase/migrations/00004_onboarding_and_profiles.sql`

2. **跳过邮箱验证**：Dashboard → Authentication → Providers → Email → 关闭 "Confirm email"

3. **注册频率限制**：Supabase 内置邮件服务约 2–3 次/小时。若出现 "email rate limit exceeded"：
   - 等待约 1 小时后重试
   - 或配置自定义 SMTP：Dashboard → Project Settings → Auth → SMTP Settings

### 2. 环境变量

`.env.local` 已配置：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 运行

```bash
npm install
npm run dev
```

访问 http://localhost:3000

## 流程

1. 首页 → 登录 / 注册
2. 登录成功 → 自动跳转 `/onboarding`
3. 完成 7 步入职问卷
4. 最后一步提交 → 写入 `profiles` 表（nickname + traits）
5. 跳转 `/dashboard`

## 控制台输出

- **获取配置**：进入 onboarding 时打印「获取到的配置数据」
- **提交成功**：最后一步点击确定后打印「提交成功后的返回对象」

## 预留组件

`app/onboarding/page.js` 中的 `StepContainer` 为预留容器，后续可替换为 Figma 设计稿组件。
