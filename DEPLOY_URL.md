# 获取可访问的在线网址

本地 `localhost` 无法访问时，可通过以下方式获取在线网址。

---

## 方式一：Vercel 一键部署（推荐）

1. 打开：**https://vercel.com/new/clone?repository-url=https://github.com/Daizi007-sog/life_light**

2. 使用 GitHub 登录 Vercel（若未登录）

3. 在「Configure Project」中，添加环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://bhxfpkcfbwxlnziepikw.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = 你的 anon key

4. 点击 **Deploy**，等待 1–2 分钟

5. 部署完成后会得到类似：**https://life-light-xxx.vercel.app**

6. 首页地址：**https://你的项目.vercel.app/home**

---

## 方式二：修复本地环境

若希望本地运行，请确认：

```bash
# 1. 检查 Node 版本（需 18+）
node -v

# 2. 重新安装依赖
rm -rf node_modules .next
npm install

# 3. 启动（等待 30–60 秒直到出现 Ready）
npm run dev
```

然后访问：**http://localhost:3000/home**
