'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/**
 * 我的页 - 预留坑位
 * TODO: 后续接入业务逻辑
 */
export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await supabase.auth.signOut();
      router.replace('/splash');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 24,
      }}
    >
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }}>我的（待开发）</p>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        style={{
          padding: '12px 32px',
          fontSize: 16,
          fontWeight: 500,
          color: '#ffffff',
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 12,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? '退出中...' : '退出登录'}
      </button>
    </div>
  );
}
