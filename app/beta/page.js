'use client';

import { useRouter } from 'next/navigation';

const BRAND = '#030424';
const SECONDARY_TEXT = '#8D8E9C';
const ACCENT_GREEN = '#34C759';
const BG_COLOR = '#F1F1F1';

export default function BetaPage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: BG_COLOR,
        position: 'relative',
        padding: '0 24px',
        paddingTop: 'max(24px, env(safe-area-inset-top))',
        paddingBottom: 'max(100px, env(safe-area-inset-bottom))',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* 1. 顶部返回按钮 */}
      <div style={{ position: 'fixed', top: 'max(12px, env(safe-area-inset-top))', left: 20, zIndex: 10 }}>
        <button
          onClick={() => router.back()}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#ffffff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}
          aria-label="返回"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke={BRAND} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 40 }}>
        {/* 2. 第一个二维码区域 (开发者微信) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 180,
              height: 180,
              background: '#ffffff',
              borderRadius: 12.8,
              padding: 12,
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            }}
          >
            <img
              src="/illustrations/wecaht.jpg"
              alt="开发者微信"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <p style={{ fontSize: 14, color: SECONDARY_TEXT }}>开发者微信二维码</p>
        </div>

        {/* 3. 分割线 (虚线) */}
        <div
          style={{
            width: '100%',
            maxWidth: 320,
            borderTop: `1px dashed #D1D1D1`,
            marginBottom: 32,
          }}
        />

        {/* 4. 第二个二维码区域 (支付) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 180,
              height: 180,
              background: '#ffffff',
              borderRadius: 12.8,
              padding: 12,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            }}
          >
            <img
              src="/illustrations/money.jpg"
              alt="支付二维码"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div style={{ textAlign: 'center', padding: '0 12px' }}>
            <p style={{ fontSize: 15, color: BRAND, fontWeight: 500, lineHeight: 1.6 }}>
              请截图扫码向开发者支持 <span style={{ color: ACCENT_GREEN, fontWeight: 700 }}>¥1.00</span>
            </p>
            <p style={{ fontSize: 15, color: BRAND, fontWeight: 500, lineHeight: 1.6 }}>
              再添加微信成为 正式版App 内测用户
            </p>
          </div>
        </div>

        {/* 5. 底部说明文字 */}
        <div style={{ marginTop: 'auto', textAlign: 'center', paddingBottom: 24 }}>
          <p style={{ fontSize: 12, color: SECONDARY_TEXT, marginBottom: 4 }}>
            所有打赏将作为"光盐旅迹"开发基金
          </p>
          <p style={{ fontSize: 12, color: SECONDARY_TEXT, marginBottom: 12 }}>
            感谢支持我们的可持续发展,期待你的同工
          </p>
          <p style={{ fontSize: 12, color: SECONDARY_TEXT }}>
            开发者邮箱:1793115223@qq.com
          </p>
        </div>
      </div>

      {/* 6. 底部悬浮按钮区 */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to top, rgba(241, 241, 241, 1) 0%, rgba(241, 241, 241, 0.9) 50%, rgba(241, 241, 241, 0) 100%)',
          padding: '20px 24px max(24px, env(safe-area-inset-bottom))',
          display: 'flex',
          gap: 12,
          zIndex: 5,
        }}
      >
        <button
          onClick={() => router.push('/home')}
          style={{
            flex: 1,
            height: 55,
            fontSize: 16,
            fontWeight: 600,
            color: BRAND,
            background: '#ffffff',
            border: `1.5px solid ${BRAND}`,
            borderRadius: 10,
            cursor: 'pointer',
          }}
        >
          已添加
        </button>
        <button
          onClick={() => router.push('/home')}
          style={{
            flex: 1,
            height: 55,
            fontSize: 16,
            fontWeight: 600,
            color: '#ffffff',
            background: BRAND,
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
          }}
        >
          跳过
        </button>
      </div>
    </div>
  );
}
