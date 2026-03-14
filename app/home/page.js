'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, safeGetUser } from '@/lib/supabase';
import { useDailyBackgroundRefresh } from '@/lib/DailyBackgroundContext';
import { PROMO_ROUTES } from '@/lib/promo-routes';

/** 印花图层：预留 Supabase Storage 链接坑位，后续替换为实际 URL */
const FLORAL_PATTERN_URL = '/assets/placeholder-card.svg';

/** 第四个模板中间层装饰图形（public/card_moban4/zhuangshi.png） */
const TEMPLATE4_DECOR_URL = '/card_moban4/zhuangshi.png';

const SUPABASE_FUNCTIONS_URL = (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL || '' : '').trim().replace(/\/$/, '');
const SCRIPTURE_CARD_GENERATE_URL = SUPABASE_FUNCTIONS_URL
  ? `${SUPABASE_FUNCTIONS_URL}/functions/v1/scripture-card-generate`
  : '';

/** Dify 对话 API 预留 - 后续接入 */
async function fetchDifyChat(_userMessage) {
  // TODO: 接入 Dify 对话 API
  await new Promise((r) => setTimeout(r, 2000));
  return '这是 AI 的回复占位文案，后续将接入 Dify API。';
}

/**
 * 调用 scripture-card-generate Edge Function 生成经文卡片
 * @param {string} userInput - 用户心情/状态
 * @param {string} accessToken - 用户 access_token
 * @returns {Promise<{ scripture_content: string, reference: string, ai_text: string, image_url?: string }>}
 */
async function fetchScriptureCardGenerate(userInput, accessToken) {
  if (!SCRIPTURE_CARD_GENERATE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL 未配置');
  }
  if (!accessToken) {
    throw new Error('请先登录');
  }
  const res = await fetch(SCRIPTURE_CARD_GENERATE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ user_input: userInput }),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('响应解析失败');
  }
  if (!res.ok) {
    throw new Error(data?.error || text || '生成失败');
  }
  return {
    scripture_content: data.scripture_content || '神爱世人，甚至将他的独生子赐给他们，叫一切信他的，不至灭亡，反得永生。',
    reference: data.reference || '约翰福音 3:16',
    ai_text: data.ai_text || '无论你此刻经历什么，神的爱永远与你同在。',
    image_url: data.image_url || null,
  };
}

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
  const [sayInput, setSayInput] = useState('');
  const [view, setView] = useState('home');
  const [messages, setMessages] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [cardData, setCardData] = useState(null);
  const [layoutId, setLayoutId] = useState(1);
  const [cardError, setCardError] = useState('');
  const lastUserInputRef = useRef('');
  const cardLayoutRef = useRef(1);
  const chatEndRef = useRef(null);

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

  const handleSendSay = async () => {
    const text = sayInput.trim();
    if (!text) return;
    setSayInput('');
    lastUserInputRef.current = text;
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setView('chat');
    setIsAiLoading(true);
    setCardData(null);
    setCardError('');
    try {
      const aiReply = await fetchDifyChat(text);
      setMessages((m) => [...m, { role: 'ai', content: aiReply }]);
      setIsAiLoading(false);
      setTimeout(() => setView('card-loading'), 1500);
    } catch {
      setMessages((m) => [...m, { role: 'ai', content: '抱歉，暂时无法回复，请稍后再试。' }]);
      setIsAiLoading(false);
    }
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    setView('home');
    setMessages([]);
    setCardData(null);
    setCardError('');
  };

  // card-loading 期间触发经文卡片生成 + 随机排版 + 入库
  useEffect(() => {
    if (view !== 'card-loading') return;
    const userInput = lastUserInputRef.current?.trim();
    if (!userInput) return;

    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token ?? null;
        if (!token) {
          const fallbackLayout = (Math.floor(Math.random() * 4) % 4) + 1;
          cardLayoutRef.current = fallbackLayout;
          setCardError('请先登录以生成经文卡片');
          setCardData({
            scripture_content: '神爱世人，甚至将他的独生子赐给他们，叫一切信他的，不至灭亡，反得永生。',
            reference: '约翰福音 3:16',
            ai_text: '登录后可获得为你定制的经文与鼓励。',
            image_url: null,
          });
          setLayoutId(fallbackLayout);
          setTimeout(() => setView('card-result'), 500);
          return;
        }
        const data = await fetchScriptureCardGenerate(userInput, token);
        if (cancelled) return;
        const chosenLayout = (Math.floor(Math.random() * 4) % 4) + 1;
        cardLayoutRef.current = chosenLayout;
        setCardData(data);
        setLayoutId(chosenLayout);
        setView('card-result');

        const user = await safeGetUser();
        if (user && data) {
          await supabase.from('scripture_cards').insert({
            user_id: user.id,
            user_input: userInput,
            scripture_content: data.scripture_content,
            ai_generated_text: data.ai_text,
            template_id: `layout-${chosenLayout}`,
            image_url: data.image_url || null,
            metadata: {},
          });
        }
      } catch (err) {
        if (cancelled) return;
        const fallbackLayout = (Math.floor(Math.random() * 4) % 4) + 1;
        cardLayoutRef.current = fallbackLayout;
        setCardError(err?.message || '生成失败');
        setCardData({
          scripture_content: '神爱世人，甚至将他的独生子赐给他们，叫一切信他的，不至灭亡，反得永生。',
          reference: '约翰福音 3:16',
          ai_text: '生成遇到问题，请稍后再试。',
          image_url: null,
        });
        setLayoutId(fallbackLayout);
        setView('card-result');
      }
    })();
    return () => { cancelled = true; };
  }, [view]);

  useEffect(() => {
    if (view === 'chat') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [view, messages]);

  /** 切换模板：1→2→3→4→1 循环 */
  const handleSwitchTemplate = () => {
    setLayoutId(prev => (prev % 4) + 1);
  };

  /** 经文卡片结果页 - 360x620 底层卡片，支持 4 种模板：图在上、图铺满、印花、福份 */
  const renderCardLayout = (lid, data) => {
    const { scripture_content = '', reference = '', ai_text = '', image_url } = data || {};
    const effectiveLid = ((lid - 1) % 4) + 1;

    // 基础容器样式
    const baseStyle = {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      padding: '100px 20px 60px',
      background: 'linear-gradient(180deg, #E8F3F6 0%, #F5F9FF 100%)',
      fontFamily: '"PingFang SC", sans-serif',
      overflow: 'hidden',
      alignItems: 'center',
    };

    // 顶部按钮样式
    const topButtonsStyle = {
      position: 'absolute',
      top: 'max(40px, env(safe-area-inset-top) + 10px)',
      width: '100%',
      maxWidth: 360,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 24px',
      zIndex: 10001
    };

    // 卡片外框样式 (360x620)
    const cardFrameStyle = {
      width: 360,
      height: 620,
      background: 'rgba(255, 255, 255, 0.7)',
      borderRadius: 35,
      padding: '35px 25px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 20px 50px rgba(0,0,0,0.06)',
      backdropFilter: 'blur(25px)',
      border: '1px solid rgba(255,255,255,0.4)',
      position: 'relative',
      overflow: 'hidden'
    };

    return (
      <div style={baseStyle}>
        {/* 顶部按钮 */}
        <div style={topButtonsStyle}>
          <button 
            type="button" 
            onClick={handleBackToHome} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#030424', 
              fontSize: 16, 
              cursor: 'pointer', 
              padding: 8, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 4, 
              opacity: 0.8,
              userSelect: 'none',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg> 返回
          </button>
          <button 
            type="button" 
            onClick={handleSwitchTemplate} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#030424', 
              fontSize: 16, 
              cursor: 'pointer', 
              padding: 8, 
              opacity: 0.8,
              fontWeight: 500,
              userSelect: 'none',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            }}
          >
            切换
          </button>
        </div>

        {/* 360x620 主卡片 */}
        <div style={cardFrameStyle}>
          {/* 标题 - 统一一致 */}
          <h2 style={{ fontSize: 24, fontWeight: 600, color: '#030424', textAlign: 'center', marginBottom: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>✨</span> 经文卡片制作完成！
          </h2>

          {/* 内容区域 - 随模板切换：1 图在上 2 图铺满 3 印花 4 福份 */}
          <div style={{ flex: 1, background: (effectiveLid === 3 || effectiveLid === 4) ? 'transparent' : '#ffffff', borderRadius: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden', marginBottom: 35, boxShadow: (effectiveLid === 3 || effectiveLid === 4) ? 'none' : '0 10px 30px rgba(0,0,0,0.03)', border: (effectiveLid === 3 || effectiveLid === 4) ? 'none' : '1px solid rgba(0,0,0,0.02)', position: 'relative' }}>
            {effectiveLid === 1 ? (
              // 模板 1：图在上，文在下
              <>
                <div style={{ width: '100%', height: 280, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {image_url ? <img src={image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ color: '#cbd5e0', fontSize: 15, fontWeight: 500 }}>图片加载中...</div>}
                </div>
                <div style={{ flex: 1, padding: '25px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: '#030424', textAlign: 'center', marginBottom: 20, lineHeight: 1.4 }}>"{ai_text || '生成遇到问题，请稍后再试。'}"</h3>
                  <p style={{ fontSize: 15, lineHeight: '1.8', color: '#4a5568', textAlign: 'justify', margin: 0, opacity: 0.9 }}>{scripture_content}</p>
                  <p style={{ fontSize: 15, color: '#718096', textAlign: 'right', fontWeight: 500, marginTop: 'auto', paddingTop: 15 }}>{reference}</p>
                </div>
              </>
            ) : effectiveLid === 2 ? (
              // 模板 2：图片铺满，文字居中
              <>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: image_url ? `url(${image_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: image_url ? 'transparent' : '#94a3b8', zIndex: 0 }} />
                {!image_url && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: 15, zIndex: 1 }}>图片加载中...</div>}
                <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%)', padding: '40px 25px', textAlign: 'center' }}>
                  <h3 style={{ fontSize: 20, fontWeight: 600, color: '#ffffff', marginBottom: 25, lineHeight: 1.5, textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
                    "{ai_text || '生成遇到问题，请稍后再试。'}"
                  </h3>
                  <p style={{ fontSize: 16, lineHeight: '1.8', color: 'rgba(255,255,255,0.95)', margin: '0 0 20px', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
                    {scripture_content}
                  </p>
                  <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: 500, textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
                    {reference}
                  </p>
                </div>
              </>
            ) : effectiveLid === 3 ? (
              // 模板 3：印花图层 + 白色背景框 + 文本居中（Figma）
              <>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: image_url ? `url(${image_url})` : `url(${FLORAL_PATTERN_URL})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#e8f4f8', zIndex: 0, borderRadius: 20 }} />
                <div style={{ position: 'relative', zIndex: 1, margin: 24, padding: '28px 24px', background: '#ffffff', borderRadius: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.04)', border: '1px solid rgba(147,197,253,0.4)', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: '#030424', textAlign: 'center', marginBottom: 20, lineHeight: 1.4 }}>"{ai_text || '生成遇到问题，请稍后再试。'}"</h3>
                  <p style={{ fontSize: 15, lineHeight: 1.8, color: '#4a5568', textAlign: 'justify', margin: 0, flex: 1, overflow: 'auto' }}>{scripture_content}</p>
                  <p style={{ fontSize: 15, color: '#718096', textAlign: 'right', fontWeight: 500, marginTop: 15, paddingTop: 15 }}>{reference}</p>
                </div>
              </>
            ) : (
              // 模板 4：福份 - 全屏背景 + 全屏装饰图层 + 定位文本
              <>
                <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundColor: '#f8fafc', borderRadius: 20, overflow: 'hidden' }}>
                  {image_url ? <img src={image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e0', fontSize: 14 }}>图片加载中...</div>}
                </div>
                <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
                  <img src={TEMPLATE4_DECOR_URL} alt="装饰" style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
                </div>
                <div style={{ position: 'absolute', zIndex: 2, top: '33%', bottom: '20%', left: '14%', right: '14%', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: '#030424', textAlign: 'center', marginBottom: 10, lineHeight: 1.3 }}>"{ai_text || '生成遇到问题，请稍后再试。'}"</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: '#4a5568', textAlign: 'justify', margin: 0, flex: 1, overflow: 'auto' }}>{scripture_content}</p>
                  <p style={{ fontSize: 13, color: '#718096', textAlign: 'right', fontWeight: 500, marginTop: 8 }}>{reference}</p>
                </div>
              </>
            )}
          </div>

          {/* 保存按钮 - 统一一致 */}
          <button type="button" onClick={() => { setToast('已保存到历史记录'); setTimeout(() => setToast(''), 2000); }} style={{ width: '100%', background: '#030424', color: '#ffffff', border: 'none', borderRadius: 15, padding: '18px 0', fontSize: 17, fontWeight: 600, cursor: 'pointer', boxShadow: '0 12px 30px rgba(3,4,36,0.3)' }}>
            保存
          </button>
        </div>
        <div style={{ height: 60 }} />
      </div>
    );
  };

  if (view === 'card-result' && cardData) {
    return (
      <>
        {renderCardLayout(layoutId, cardData)}
        {toast && (
          <div style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', padding: '12px 24px', background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: 14, borderRadius: 8, zIndex: 9999, fontFamily: '"PingFang SC", sans-serif' }}>
            {toast}
          </div>
        )}
      </>
    );
  }

  if (view === 'card-loading') {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          padding: 'max(100px, env(safe-area-inset-top) + 60px) 24px max(24px, env(safe-area-inset-bottom))',
          background: 'linear-gradient(180deg, #E8F3F6 0%, #F5F9FF 100%)',
        }}
      >
        {/* 顶部标题与说明 - 整体下移 */}
        <div style={{ padding: '0 8px 32px' }}>
          <h1
            style={{
              fontFamily: '"PingFang SC", sans-serif',
              fontSize: 24,
              fontWeight: 600,
              color: '#030424',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 20 }}>✨</span> 经文卡片生成中...
          </h1>
          <p
            style={{
              fontFamily: '"PingFang SC", sans-serif',
              fontSize: 15,
              lineHeight: '1.8',
              color: '#666666',
              textAlign: 'justify',
            }}
          >
            我为你生成一张经文卡片，它将用温暖的文字编织成小光毯，把鼓励的力量悄悄裹进你的心里生成好后我会告诉你回来查看
          </p>
        </div>

        {/* 中央卡片部分 */}
        <div
          style={{
            flex: 1,
            maxHeight: 460,
            background: '#CBE4ED',
            borderRadius: 24,
            padding: '40px 24px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
            overflow: 'hidden',
          }}
        >
          {/* Shimmer overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.2) 50%, transparent 75%)',
              backgroundSize: '200% 100%',
              animation: 'skeleton-shimmer 2s infinite linear',
            }}
          />

          {/* 骨架屏线条 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
            <div style={{ height: 24, background: '#F5FBFF', borderRadius: 12, width: '85%' }} />
            <div style={{ height: 24, background: '#F5FBFF', borderRadius: 12, width: '100%' }} />
            <div style={{ height: 24, background: '#F5FBFF', borderRadius: 12, width: '100%' }} />
            <div style={{ height: 24, background: '#F5FBFF', borderRadius: 12, width: '65%' }} />
            <div style={{ height: 24, background: '#F5FBFF', borderRadius: 12, width: '70%', opacity: 0.4 }} />
          </div>

          {/* 卡片内底部文案 */}
          <div
            style={{
              marginTop: 'auto',
              textAlign: 'center',
              fontFamily: '"PingFang SC", sans-serif',
              fontSize: 14,
              color: '#5A7D87',
              fontWeight: 500,
            }}
          >
            生成预计 30 秒
          </div>
        </div>

        {/* 底部提示小字 */}
        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <p
            style={{
              fontFamily: '"PingFang SC", sans-serif',
              fontSize: 13,
              color: '#999999',
              letterSpacing: '0.5px',
            }}
          >
            生成中请勿退出本页面
          </p>
        </div>

        {/* 底部安全区占位 */}
        <div style={{ flex: 0.1 }} />
      </div>
    );
  }

  if (view === 'chat') {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, #E8F3F6 0%, #F5F9FF 100%)',
          paddingTop: 'max(100px, env(safe-area-inset-top) + 60px)',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
        }}
      >
        <div style={{ marginBottom: 16, padding: '0 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={handleBackToHome}
            style={{
              background: 'none',
              border: 'none',
              color: '#030424',
              fontSize: 16,
              cursor: 'pointer',
              padding: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              opacity: 0.8
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            返回
          </button>
          <span style={{ fontSize: 18, fontWeight: 600, color: '#030424' }}>对话</span>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '80%',
                  padding: '12px 16px',
                  borderRadius: 16,
                  fontFamily: '"PingFang SC", sans-serif',
                  fontSize: 15,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  background: msg.role === 'user' ? '#030424' : '#ffffff',
                  color: msg.role === 'user' ? '#ffffff' : '#030424',
                  boxShadow: msg.role === 'user' ? '0 4px 12px rgba(3,4,36,0.1)' : '0 4px 12px rgba(0,0,0,0.05)',
                  borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                  borderBottomLeftRadius: msg.role === 'user' ? 16 : 4,
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isAiLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 16,
                  borderBottomLeftRadius: 4,
                  fontFamily: '"PingFang SC", sans-serif',
                  fontSize: 15,
                  color: '#666666',
                  background: '#ffffff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                }}
              >
                AI 正在思考...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>
    );
  }

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
        <input
          id="home-say-input"
          name="say_something"
          type="text"
          placeholder="说点什么吧..."
          value={sayInput}
          onChange={(e) => setSayInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendSay()}
          className="home-input"
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: 16, fontFamily: '"PingFang SC", sans-serif' }}
        />
        <button
          type="button"
          onClick={handleSendSay}
          style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="发送"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
