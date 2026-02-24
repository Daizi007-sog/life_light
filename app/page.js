'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function redirect() {
      const { data: { user } } = await supabase.auth.getUser();
      setChecking(false);
      if (user) {
        router.replace('/onboarding');
      } else {
        router.replace('/splash');
      }
    }
    redirect();
  }, [router]);

  return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <p>{checking ? '跳转中...' : ''}</p>
    </div>
  );
}
