# Edge Functions 部署说明

## life-main-text（主页正文 AI 生成）

为主页正文部分提供 DeepSeek AI 生成支持。

### 前置条件

1. 在 Supabase Dashboard → Project Settings → Edge Functions → Secrets 中已配置 `DEEPSEEK_API_KEY`
2. 已安装 [Supabase CLI](https://supabase.com/docs/guides/cli)

### 部署

```bash
supabase functions deploy life-main-text
```

### 调用方式

**URL**: `https://<project-ref>.supabase.co/functions/v1/life-main-text`

**方法**: POST

**Headers**:
- `Authorization: Bearer <SUPABASE_ANON_KEY>` 或用户 JWT
- `Content-Type: application/json`

**Body**（可选）:
```json
{
  "prompt": "自定义提示词，不传则使用默认"
}
```

**响应**:
```json
{
  "content": "AI 生成的正文内容",
  "model": "deepseek-chat"
}
```

### 前端调用示例

```javascript
const { data, error } = await supabase.functions.invoke('life-main-text', {
  body: { prompt: '可选的自定义提示' },
});
// data.content 为生成的正文
```

### AI 未连接 排查

当首页显示「AI 未连接」时，打开浏览器控制台（F12）查看 `[life-main-text]` 开头的日志：

| 日志 | 可能原因 | 处理 |
|------|----------|------|
| `未登录，跳过 AI 请求` | 未登录或 session 失效 | 重新登录 |
| `失败: 请求超时` | Edge Function 响应慢或未部署 | 检查 `supabase functions deploy life-main-text` |
| `失败: ...` | 其他错误 | 查看完整错误信息 |

**常见检查项：**

1. **Edge Function 已部署**：`supabase functions deploy life-main-text`
2. **DEEPSEEK_API_KEY 已配置**：Supabase Dashboard → Edge Functions → Secrets
3. **CSP 阻止 eval**：若控制台有 CSP 错误，尝试在系统浏览器（Chrome/Safari）打开，而非 Cursor 预览
4. **点击「更新」**：AI 失败时可点击左上角「更新」按钮重试
