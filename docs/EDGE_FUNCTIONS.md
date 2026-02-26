# Edge Functions 部署说明

## dify-encouragement（主页鼓励话语）

从 Supabase profiles 读取用户画像，调用 Dify 工作流生成个性化鼓励文字。

### 前置条件

1. 在 Supabase Dashboard → Project Settings → Edge Functions → Secrets 中已配置 `DIFY_API_KEY`
2. 已安装 [Supabase CLI](https://supabase.com/docs/guides/cli)

### 部署

```bash
supabase functions deploy dify-encouragement --no-verify-jwt
```

`--no-verify-jwt` 允许匿名调用；传入用户 JWT 时可读取其 profiles 画像生成个性化内容。

### 调用方式

**URL**: `https://<project-ref>.supabase.co/functions/v1/dify-encouragement`

**方法**: POST

**Headers**:
- `Authorization: Bearer <SUPABASE_ANON_KEY>` 或用户 JWT（推荐登录用户携带 JWT 以获取个性化内容）
- `Content-Type: application/json`

**Body**: `{}`（空对象即可）

**响应**:
```json
{
  "content": "AI 生成的鼓励文字"
}
```

### 前端调用示例

```javascript
const { data: { session } } = await supabase.auth.getSession();
const res = await fetch('https://<project-ref>.supabase.co/functions/v1/dify-encouragement', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token || anonKey}`,
  },
  body: JSON.stringify({}),
});
const { content } = await res.json();
```

### AI 未连接 排查

当首页显示「AI 未连接」时，打开浏览器控制台（F12）查看 `[dify-encouragement]` 开头的日志：

| 日志 | 可能原因 | 处理 |
|------|----------|------|
| `失败: 请求超时` | Edge Function 响应慢或未部署 | 检查 `supabase functions deploy dify-encouragement` |
| `失败: ...` | 其他错误 | 查看完整错误信息 |

**常见检查项：**

1. **Edge Function 已部署**：`supabase functions deploy dify-encouragement`
2. **DIFY_API_KEY 已配置**：Supabase Dashboard → Edge Functions → Secrets
3. **Dify 工作流**：确保工作流输入变量 `user_profile` 已配置
4. **点击「更新」**：AI 失败时可点击左上角「更新」按钮重试

---

## health-check（连接检测）

用于检测 Supabase Edge Functions 与 Dify 的配置是否正常。

### 部署

```bash
supabase functions deploy health-check --no-verify-jwt
```

### 调用方式

**URL**: `https://<project-ref>.supabase.co/functions/v1/health-check`

**方法**: GET 或 POST

**响应示例**（成功）:
```json
{
  "ok": true,
  "message": "所有检查通过",
  "checks": {
    "DIFY_API_KEY": "ok",
    "SUPABASE_URL": "ok",
    "SUPABASE_SERVICE_ROLE_KEY": "ok",
    "SUPABASE_DB": "ok (profiles: 5)",
    "DIFY_API": "key_configured (未实际调用 Dify)"
  }
}
```

**响应示例**（失败）:
```json
{
  "ok": false,
  "message": "部分检查失败",
  "checks": {
    "DIFY_API_KEY": "missing_or_invalid",
    ...
  }
}
```

### 快速测试

```bash
# 将 <project-ref> 替换为你的 Supabase 项目 ID
curl "https://<project-ref>.supabase.co/functions/v1/health-check"
```
