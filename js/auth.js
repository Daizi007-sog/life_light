/**
 * 登录/登出、会话管理
 */
import { getSupabase, initSupabase } from './supabase-client.js';

const AUTH_TIMEOUT_MS = 3000;

/** 清除 Supabase 本地会话存储，修复 Cookie/Storage 损坏 */
function clearAuthStorage() {
    try {
        Object.keys(localStorage || {}).filter((k) => k.startsWith('sb-')).forEach((k) => localStorage.removeItem(k));
    } catch {}
}

/** 损坏存储时清除并重新加载（仅一次，避免死循环） */
function handleStorageErrorAndReload() {
    const key = 'life_light_auth_cleared_reload';
    if (sessionStorage?.getItem(key)) return;
    sessionStorage?.setItem(key, '1');
    clearAuthStorage();
    window.location?.reload();
}

export async function getCurrentUser() {
    const supabase = await initSupabase();
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

/** 安全获取用户：3 秒超时，异常时清除存储，必要时重新加载 */
export async function safeGetCurrentUser() {
    const supabase = await initSupabase();
    if (!supabase) return null;
    try {
        const userPromise = supabase.auth.getSession().then((r) => r.data?.session?.user ?? null);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), AUTH_TIMEOUT_MS));
        return await Promise.race([userPromise, timeoutPromise]);
    } catch (err) {
        clearAuthStorage();
        if (err?.message !== 'timeout') handleStorageErrorAndReload();
        return null;
    }
}

export async function signIn(email, password) {
    const supabase = await initSupabase();
    if (!supabase) throw new Error('Supabase 未配置');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

export async function signUp(email, password) {
    const supabase = await initSupabase();
    if (!supabase) throw new Error('Supabase 未配置');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
}

export async function signOut() {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
}

export function onAuthStateChange(callback) {
    return getSupabase()?.auth.onAuthStateChange(callback);
}
