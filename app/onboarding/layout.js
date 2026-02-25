'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, safeGetSession } from '@/lib/supabase';
import { OnboardingProvider } from '@/context/OnboardingContext';

export default function OnboardingLayout({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const session = await safeGetSession();
        if (!session) {
          router.replace('/login');
          return;
        }
        // 已完成 onboarding 的用户（有 profile）直接进首页
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('user_id', session.user.id)
          .maybeSingle();
        if (profile) {
          router.replace('/home');
          return;
        }
        setReady(true);
      } catch {
        router.replace('/login');
      }
    }
    check();
  }, [router]);

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <p style={{ color: '#030424' }}>加载中...</p>
      </div>
    );
  }

  return (
    <OnboardingProvider>
      <div style={{ minHeight: '100vh', background: '#fff' }}>
        {children}
      </div>
    </OnboardingProvider>
  );
}
