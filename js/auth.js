/**
 * 登录/登出、会话管理
 */
import { getSupabase, initSupabase } from './supabase-client.js';

export async function getCurrentUser() {
    const supabase = await initSupabase();
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
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
