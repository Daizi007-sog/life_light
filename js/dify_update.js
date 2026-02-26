/**
 * 主页鼓励话语 - Dify 工作流集成
 * 从 Supabase 读取用户画像 -> Edge Function 调用 Dify -> 缓存 4 小时
 * 配置从 window.__ENV__ 读取，禁止硬编码 API Key
 */
import { getSupabase, initSupabase } from './supabase-client.js';

const CACHE_KEY = 'life_light_encouragement';
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 小时

function getSupabaseUrl() {
  return (typeof window !== 'undefined' && window.__ENV__?.VITE_SUPABASE_URL) || '';
}

function getAnonKey() {
  return (typeof window !== 'undefined' && window.__ENV__?.VITE_SUPABASE_ANON_KEY) || '';
}

function getCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.ts || !parsed?.content) return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.content;
  } catch {
    return null;
  }
}

function setCache(content) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ content, ts: Date.now() }));
  } catch {}
}

/**
 * 获取鼓励话语：优先缓存，超 4 小时则重新请求
 * @returns {Promise<{ content: string; fromCache: boolean }>}
 */
export async function fetchEncouragement() {
  const cached = getCache();
  if (cached) return { content: cached, fromCache: true };

  const url = `${getSupabaseUrl()}/functions/v1/dify-encouragement`;
  const supabase = await initSupabase();
  let authHeader = `Bearer ${getAnonKey()}`;
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      authHeader = `Bearer ${session.access_token}`;
    }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify({}),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('响应解析失败');
  }

  if (res.status !== 200) {
    throw new Error(data?.error || `请求失败: ${res.status}`);
  }

  const content = (data?.content ?? '').trim() || '今日愿你平安，在祂的恩典中得享安息。';
  setCache(content);
  return { content, fromCache: false };
}
