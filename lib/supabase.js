import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

const AUTH_TIMEOUT_MS = 3000;

/**
 * 清除 Supabase 本地会话存储，用于修复 Cookie/Storage 损坏导致的初始化失败
 */
export function clearAuthStorage() {
  if (typeof localStorage === 'undefined') return;
  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith('sb-'));
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // 忽略清除失败
  }
}

/**
 * 安全获取当前用户，3 秒超时或异常时返回 null，必要时清除损坏存储
 * 用于避免 ERR_CONNECTION_CLOSED / Failed to fetch 导致页面一直 loading
 */
export async function safeGetUser() {
  try {
    const userPromise = supabase.auth.getUser().then((r) => r.data?.user ?? null);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), AUTH_TIMEOUT_MS)
    );
    return await Promise.race([userPromise, timeoutPromise]);
  } catch (err) {
    clearAuthStorage();
    return null;
  }
}

/**
 * 安全获取当前 session，3 秒超时或异常时返回 null，必要时清除损坏存储
 */
export async function safeGetSession() {
  try {
    const sessionPromise = supabase.auth.getSession().then((r) => r.data?.session ?? null);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), AUTH_TIMEOUT_MS)
    );
    return await Promise.race([sessionPromise, timeoutPromise]);
  } catch (err) {
    clearAuthStorage();
    return null;
  }
}

/**
 * 检测是否为会话损坏类错误，若是则清除存储并重新加载（仅执行一次，避免死循环）
 */
export function handleAuthStorageError() {
  if (typeof window === 'undefined') return;
  const reloadKey = 'life_light_auth_cleared_reload';
  if (sessionStorage.getItem(reloadKey)) return;
  sessionStorage.setItem(reloadKey, '1');
  clearAuthStorage();
  window.location.reload();
}
