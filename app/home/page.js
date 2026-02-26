'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, safeGetUser } from '@/lib/supabase';
import { useDailyBackgroundRefresh } from '@/lib/DailyBackgroundContext';
import { PROMO_ROUTES } from '@/lib/promo-routes';

const CACHE_KEY_PREFIX = 'dify_encouragement';
const SEGMENTS_PER_DAY = 4;
const FETCH_TIMEOUT_MS = 60000;

function getCurrentSegmentKey() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const segment = Math.floor(now.getHours() / (24 / SEGMENTS_PER_DAY));
  return `${date}-${segment}`;
}

const SUPABASE_URL = (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL || '' : '').trim();
const DIFY_ENCOURAGEMENT_URL = SUPABASE_URL
  ? `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/dify-encouragement`
  : '';

/**
 * 调用 dify-encouragement Edge Function 获取鼓励话语
 * 传入 access_token 时，Edge Function 可读取用户画像生成个性化鼓励文字
 */
async function fetchDifyEncouragement(accessToken) {
  if (!DIFY_ENCOURAGEMENT_URL) {
    return { ok: false, status: 0, text: 'NEXT_PUBLIC_SUPABASE_URL 未配置', data: null };
  }
  const headers = { 'Content-Type': 'application/json' };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  const res = await fetch(DIFY_ENCOURAGEMENT_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  });
  const text = await res.text();
  if (res.status !== 200) {
    if (typeof window !== 'undefined') {
      console.error('[dify-encouragement] 非 200 响应:', res.status, text);
    }
    return { ok: false, status: res.status, text, data: null };
  }
  try {
    const data = JSON.parse(text);
    return { ok: true, status: res.status, text, data };
  } catch {
    if (typeof window !== 'undefined') {
      console.error('[dify-encouragement] JSON 解析失败:', text?.slice(0, 500));
    }
    return { ok: false, status: res.status, text, data: null };
  }
}

export default function HomePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const refreshBg = useDailyBackgroundRefresh();
  const [toast, setToast] = useState('');
  const [mainContent, setMainContent] = useState('');
  const [aiStatus, setAiStatus] = useState('loading');

  const fetchEncouragement = useCallback(async (options = {}) => {
    const { forceRefresh = false } = options;
    const log = (msg, data) => {
      if (typeof window !== 'undefined') {
        console.log('[dify-encouragement]', msg, data !== undefined ? data : '');
      }
    };
    const logErr = (msg, err) => {
      if (typeof window !== 'undefined') {
        console.error('[dify-encouragement]', msg, err?.message || err, err);
      }
    };

    setAiStatus('loading');
    const segmentKey = getCurrentSegmentKey();
    const cacheKey = `${CACHE_KEY_PREFIX}_anon`;

    try {
      const user = await safeGetUser();
      if (user && !forceRefresh) {
        const userCacheKey = `${CACHE_KEY_PREFIX}_${user.id}`;
        try {
          const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(userCacheKey) : null;
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.segment === segmentKey && parsed?.content) {
              setMainContent(parsed.content);
              setAiStatus('connected');
              log('命中缓存', { segment: segmentKey });
              return;
            }
          }
        } catch {
          // 缓存解析失败，忽略
        }
      }

      log('开始请求，超时 ' + FETCH_TIMEOUT_MS + 'ms');
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('请求超时')), FETCH_TIMEOUT_MS)
      );

      let accessToken = null;
      if (user) {
        const { data: { session } } = await supabase.auth.getSession();
        accessToken = session?.access_token ?? null;
      }

      let result;
      try {
        result = await Promise.race([fetchDifyEncouragement(accessToken), timeoutPromise]);
      } catch (err) {
        const isTimeout = err?.message === '请求超时';
        if (isTimeout) {
          setAiStatus('timeout');
          setMainContent(''); // 超时清空，由 displayContent 回退到默认文案
          if (typeof window !== 'undefined') {
            console.error('[dify-encouragement] error.message:', err?.message);
          }
          return;
        }
        if (typeof window !== 'undefined') {
          console.error('[dify-encouragement] 捕获异常:', err?.message, err);
        }
        throw err;
      }

      if (!result.ok || !result.data || typeof result.data !== 'object') {
        logErr('响应错误', result);
        if (typeof window !== 'undefined' && result?.text) {
          console.error('[dify-encouragement] response.text():', result.text);
        }
        throw new Error(result?.data?.error || result?.text || '无返回内容');
      }
      const res = result.data;
      const content = res?.content != null ? String(res.content).trim() : '';

      if (content) {
        setMainContent(content);
        setAiStatus('connected');
        const key = user ? `${CACHE_KEY_PREFIX}_${user.id}` : cacheKey;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, JSON.stringify({ content, segment: segmentKey }));
        }
        if (typeof window !== 'undefined') {
          console.log('✅ 成功透传 Dify 文本并更新 UI:', content.slice(0, 80) + (content.length > 80 ? '...' : ''));
        }
      } else {
        if (typeof window !== 'undefined') {
          console.error('❌ 收到响应但 content 为空:', res);
        }
        throw new Error('无返回内容');
      }
    } catch (err) {
      setAiStatus('failed');
      setMainContent('');
      logErr('失败', err);
      if (typeof window !== 'undefined') {
        console.log('[dify-encouragement] error.message:', err?.message);
        console.log('[dify-encouragement] 已退出加载，显示默认文案');
      }
    }
  }, []);

  useEffect(() => {
    fetchEncouragement();
  }, [fetchEncouragement]);

  useEffect(() => {
    async function fetchNickname() {
      try {
        const user = await safeGetUser();
        if (!user) return;
        const { data } = await supabase
          .from('profiles')
          .select('nickname')
          .eq('user_id', user.id)
          .maybeSingle();
        if (data?.nickname?.trim()) {
          setNickname(data.nickname.trim());
        }
      } catch {}
    }
    fetchNickname();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return '早上好';
    if (h >= 12 && h < 18) return '下午好';
    return '晚上好';
  };

  const AI_CONTENT_PLACEHOLDER = `在寻求内心平安的旷野中，你并不孤单。基督曾说:"我留下平安给你们，我将我的平安赐给你们。"这平安不像世人所求的虚幻安稳,而是穿越风暴仍屹立不灭的应许。让祂的平安在你心里作主,照亮前路。`;
  const displayContent =
    aiStatus === 'loading' ? '正在加载...' : mainContent || AI_CONTENT_PLACEHOLDER;

  const handleRefreshBg = () => {
    setMainContent('');
    setAiStatus('loading');
    refreshBg();
    fetchEncouragement({ forceRefresh: true });
    setToast('正在刷新背景与鼓励话语...');
    setTimeout(() => setToast(''), 2000);
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: 'max(24px, env(safe-area-inset-top)) 32px 100px',
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', top: 'max(24px, env(safe-area-inset-top))', left: 32, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: '"PingFang SC", sans-serif' }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: aiStatus === 'connected' ? '#34C759' : aiStatus === 'failed' ? '#FF3B30' : aiStatus === 'timeout' ? '#FFCC00' : '#FFCC00' }} />
          {aiStatus === 'loading' && 'AI 生成中，请稍候...'}
          {aiStatus === 'timeout' && '请求超时，点击更新重试'}
          {aiStatus === 'connected' && 'Dify 已连接'}
          {aiStatus === 'failed' && 'AI 未连接'}
        </div>
        <button type="button" onClick={handleRefreshBg} style={{ padding: '6px 12px', fontSize: 12, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, cursor: 'pointer', fontFamily: '"PingFang SC", sans-serif' }}>
          更新
        </button>
      </div>
      <div style={{ position: 'absolute', top: 'max(24px, env(safe-area-inset-top))', right: 32, display: 'flex', gap: 24, zIndex: 10 }}>
        <button type="button" onClick={() => router.push(`${PROMO_ROUTES.vision}?from=home`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} aria-label="拉新">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.9 }}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </button>
        <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} aria-label="下载">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.9 }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
        <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} aria-label="音乐">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.9 }}>
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </button>
      </div>
      {toast && (
        <div style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', padding: '12px 24px', background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: 14, borderRadius: 8, zIndex: 9999, fontFamily: '"PingFang SC", sans-serif' }}>
          {toast}
        </div>
      )}
      <div style={{ height: 60 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 40 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: '"PingFang SC", sans-serif', fontSize: 32, fontWeight: 600, lineHeight: 1.2, color: '#ffffff', marginBottom: 8, letterSpacing: '0.5px', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
            {greeting()} {nickname || '朋友'}
          </h1>
          <p style={{ fontFamily: '"PingFang SC", sans-serif', fontSize: 18, fontWeight: 400, color: 'rgba(255,255,255,0.85)', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
            今天的你还好吗
          </p>
        </div>
        <div style={{ minHeight: 100 }}>
          <p style={{ fontFamily: '"PingFang SC", sans-serif', fontSize: 16, fontWeight: 400, lineHeight: '1.8', color: '#ffffff', whiteSpace: 'pre-wrap', textAlign: 'justify', opacity: 0.95, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
            {displayContent}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', borderRadius: 28, padding: '8px 8px 8px 24px', border: '1px solid rgba(255,255,255,0.12)', marginBottom: 'env(safe-area-inset-bottom)' }}>
        <input id="home-say-input" name="say_something" type="text" placeholder="说点什么吧..." disabled style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: 16, fontFamily: '"PingFang SC", sans-serif' }} />
        <button type="button" style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="发送">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
