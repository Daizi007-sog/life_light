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
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "object-src 'self' data:",
              "font-src 'self' data:",
              "connect-src 'self' https: wss:",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
