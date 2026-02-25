'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * AI 功能加载页
 * 四个按钮（愿景页、商业化页）点击后进入此页，加载完成后跳转主页
 * Figma: node-id=188-420
 */
export default function LoadingPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace('/home'), 2500);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        paddingTop: 'max(24px, env(safe-area-inset-top))',
        paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
        background: '#ffffff',
      }}
    >
      {/* 中央插画 - Figma 黄色星星+装饰元素风格 */}
      <div style={{ marginBottom: 32, position: 'relative' }}>
        <img
          src="/illustrations/loading.png"
          alt=""
          style={{
            width: 140,
            height: 140,
            objectFit: 'contain',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      </div>

      {/* 文案 - Figma Font: 20px PingFang SC, lineHeight 100 */}
      <p
        style={{
          fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
          fontSize: 20,
          fontWeight: 400,
          lineHeight: 1,
          color: '#030424',
          textAlign: 'center',
        }}
      >
        努力加载中...
      </p>
    </div>
  );
}
