'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { safeGetUser } from '@/lib/supabase';

const FORCE_EXIT_MS = 3000; // 3 秒后强制退出 Loading，无论初始化是否成功

export default function RootPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const doneRef = useRef(false);

  useEffect(() => {
    function finish(goHome) {
      if (doneRef.current) return;
      doneRef.current = true;
      setChecking(false);
      router.replace(goHome ? '/home' : '/splash');
    }

    const forceExitTimer = setTimeout(() => {
      if (doneRef.current) return;
      finish(false);
    }, FORCE_EXIT_MS);

    (async function init() {
      try {
        const user = await safeGetUser();
        if (doneRef.current) return;
        clearTimeout(forceExitTimer);
        finish(!!user);
      } catch {
        if (doneRef.current) return;
        clearTimeout(forceExitTimer);
        finish(false);
      }
    })();

    return () => clearTimeout(forceExitTimer);
  }, [router]);

  return (
    <div style={{ padding: 24, textAlign: 'center', minHeight: '50vh' }}>
      {checking ? (
        <p>跳转中...</p>
      ) : (
        <div>
          <p style={{ marginBottom: 16 }}>若未自动跳转，请手动选择：</p>
          <Link href="/splash" style={{ display: 'block', marginBottom: 8, color: '#030424' }}>进入启动页</Link>
          <Link href="/home" style={{ display: 'block', color: '#030424' }}>进入首页</Link>
        </div>
      )}
    </div>
  );
}
