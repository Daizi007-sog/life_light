'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { OnboardingProvider } from '@/context/OnboardingContext';

export default function OnboardingLayout({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login');
      } else {
        setReady(true);
      }
    }).catch(() => {
      router.replace('/login');
    });
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
