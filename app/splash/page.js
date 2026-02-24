'use client';

import { useRouter } from 'next/navigation';

/**
 * 启动页 / Splash Page
 * Figma: node-id=169-401
 * https://www.figma.com/design/g7IFv5MvWnB4091iglOKc7/中转站?node-id=169-401
 */
export default function SplashPage() {
  const router = useRouter();
  const BRAND = '#030424'; // 文字色1

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 'max(24px, env(safe-area-inset-top)) 24px max(40px, env(safe-area-inset-bottom))',
        background: 'linear-gradient(to bottom, #E8F0FE 0%, #F5F9FF 40%, #FFFFFF 100%)',
      }}
    >
      {/* 顶部占位 - 减小比例使下方文案上移 */}
      <div style={{ flex: 0.6 }} />

      {/* 中央主文案 - 提升至中上部 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
            fontSize: 28,
            fontWeight: 600,
            color: BRAND,
            marginBottom: 16,
            lineHeight: 1.4,
          }}
        >
          做光做盐 常常纪念
        </h1>
        <p
          style={{
            fontFamily: '"PingFang SC", "Helvetica Neue", sans-serif',
            fontSize: 16,
            fontWeight: 400,
            color: BRAND,
            letterSpacing: '0.5px',
          }}
        >
          — 光盐旅记 —
        </p>
      </div>

      {/* 底部占位 - 增加比例推挤文案上移 */}
      <div style={{ flex: 1 }} />

      {/* 底部双按钮 - 注册 | 登录 */}
      <div
        style={{
          width: '100%',
          maxWidth: 343,
          display: 'flex',
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={() => router.push('/register')}
          style={{
            flex: 1,
            height: 56,
            fontSize: 16,
            fontWeight: 600,
            color: '#ffffff',
            background: BRAND,
            border: 'none',
            borderRadius: 16,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          注册
        </button>
        <button
          type="button"
          onClick={() => router.push('/login')}
          style={{
            flex: 1,
            height: 56,
            fontSize: 16,
            fontWeight: 600,
            color: '#ffffff',
            background: BRAND,
            border: 'none',
            borderRadius: 16,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          登录
        </button>
      </div>
    </div>
  );
}
