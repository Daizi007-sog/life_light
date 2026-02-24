/**
 * Supabase 客户端初始化
 * 在 js/config.js 中配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = (typeof window !== 'undefined' && window.__ENV__?.VITE_SUPABASE_URL) || '';
const SUPABASE_ANON_KEY = (typeof window !== 'undefined' && window.__ENV__?.VITE_SUPABASE_ANON_KEY) || '';

let supabase = null;

export async function initSupabase() {
    if (supabase) return supabase;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.warn('Supabase 未配置，请在 js/config.js 中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
        return null;
    }
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabase;
}

export function getSupabase() {
    return supabase;
}
