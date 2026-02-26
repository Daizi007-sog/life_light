/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 兼容错误请求 /next/static → /_next/static（Cursor 预览等环境可能请求错误路径）
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/next/static/:path*', destination: '/_next/static/:path*' },
      ],
    };
  },
  // 已移除 CSP，避免拦截第三方库（如 Supabase）内部使用的 eval
};

module.exports = nextConfig;
