'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Dashboard - 个人档案生成 loading 页
 * 加载完成后跳转至愿景页面
 * Figma: node-id=177-485
 */
export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace('/vision'), 2500);
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
        background: '#ffffff',
      }}
    >
      {/* 中央插画 - 使用 illustrations/loading.png */}
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

      {/* 文案 - Figma Font 6: 20px PingFang SC */}
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
        个人档案生成中...
      </p>
    </div>
  );
}
