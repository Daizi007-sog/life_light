'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/onboarding');
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>光盐旅记</h1>
      <p style={{ marginTop: 16 }}>Onboarding 已完成，欢迎使用。</p>
      <button onClick={() => router.push('/onboarding')} style={{ marginTop: 24, marginRight: 12 }}>
        返回 Onboarding
      </button>
      <button onClick={handleLogout} style={{ marginTop: 24 }}>
        退出登录
      </button>
    </div>
  );
}
