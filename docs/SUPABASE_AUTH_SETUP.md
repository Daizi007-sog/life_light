# Supabase 认证配置说明

## 解决注册 422 错误

使用「用户名 + 密码」注册时，系统会将用户名转换为内部邮箱（如 `xxx@life-light.local`）。若 Supabase 开启了「邮箱确认」，会尝试发送确认邮件，但默认 SMTP 无法向此类地址发信，导致 **422 Unprocessable Content**。

### 必须操作：关闭邮箱确认

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择项目 → **Authentication** → **Providers** → **Email**
3. 找到 **Confirm email**，设为 **OFF**
4. 保存

关闭后，新用户注册将立即生效，无需邮件确认。

## 数据库触发器

项目包含 `00010_auth_user_profile_trigger.sql`，在 `auth.users` 插入时自动创建 `profiles` 行。请确保已执行迁移：

```bash
supabase db push
# 或
supabase migration up
```
