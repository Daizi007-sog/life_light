'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { usernameToEmail, validateUsername } from '@/lib/auth-utils';

/**
 * 登录页 - 严格匹配注册页设计规范
 */
export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 设计规范变量
  const BRAND = '#030424';
  const TEXT_SECONDARY = '#5B5C70';
  const TEXT_MUTED = '#8D8E9C';
  const BORDER = '#F1F1F1';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    
    setError('');
    const errMsg = validateUsername(username);
    if (errMsg) {
      setError(errMsg);
      return;
    }

    setLoading(true);
    try {
      const email = usernameToEmail(username);
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      // 已完成 onboarding 的用户（有 profile）直接进首页，否则进入引导流程
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', data.user.id)
        .maybeSingle();
      router.replace(profile ? '/home' : '/onboarding');
    } catch (err) {
      const msg = err.message || '';
      setError(msg.includes('Invalid login credentials') ? '用户名或密码错误' : (msg || '登录失败'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        padding: '0 24px',
        paddingTop: 'max(24px, env(safe-area-inset-top))',
        paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
        background: '#ffffff',
      }}
    >
      {/* Header: 返回启动页 */}
      <header style={{ marginBottom: 40, marginTop: 8 }}>
        <Link href="/splash" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          marginLeft: -8,
          color: BRAND,
          textDecoration: 'none'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
      </header>

      {/* 标题 */}
      <h1
        style={{
          fontFamily: '"PingFang SC", sans-serif',
          fontSize: 24,
          fontWeight: 500,
          lineHeight: 1,
          color: BRAND,
          marginBottom: 40,
        }}
      >
        登录
      </h1>

      {/* 表单区域 */}
      <form id="login-form" name="loginForm" onSubmit={handleSubmit} style={{ flex: 1 }}>
        <div style={{ marginBottom: 24 }}>
          <label htmlFor="login-username" style={{ display: 'block', fontSize: 14, color: TEXT_SECONDARY, marginBottom: 12, fontWeight: 500 }}>
            用户名
          </label>
          <input
            id="login-username"
            name="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="请输入用户名"
            required
            style={{
              width: '100%',
              padding: '18px 20px',
              fontSize: 16,
              color: BRAND,
              background: '#ffffff',
              border: `1.5px solid ${BORDER}`,
              borderRadius: 16,
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ marginBottom: 32 }}>
          <label htmlFor="login-password" style={{ display: 'block', fontSize: 14, color: TEXT_SECONDARY, marginBottom: 12, fontWeight: 500 }}>
            密码
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '18px 50px 18px 20px',
                fontSize: 16,
                color: BRAND,
                background: '#ffffff',
                border: `1.5px solid ${BORDER}`,
                borderRadius: 16,
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: TEXT_MUTED,
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.45 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              )}
            </button>
          </div>
        </div>

        {error && (
          <p style={{ color: '#FF4D4F', fontSize: 14, marginBottom: 24, textAlign: 'center' }}>
            {error}
          </p>
        )}

        <button
          id="login-submit"
          name="submit"
          type="submit"
          disabled={loading || !username || !password}
          style={{
            width: '100%',
            height: 56,
            fontSize: 16,
            fontWeight: 600,
            color: '#ffffff',
            background: (loading || !username || !password) ? '#E8E8E8' : BRAND,
            border: 'none',
            borderRadius: 16,
            cursor: (loading || !username || !password) ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {loading ? '处理中...' : '确定'}
        </button>
      </form>

      {/* 底部跳转 */}
      <div style={{ marginTop: 'auto', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: TEXT_MUTED }}>
          还没有账号？{' '}
          <Link href="/register" style={{ color: BRAND, fontWeight: 600, textDecoration: 'none' }}>
            去注册
          </Link>
        </p>
      </div>
    </div>
  );
}
