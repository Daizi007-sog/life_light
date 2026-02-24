/**
 * 前端配置 - Supabase 客户端初始化
 * 生产环境可通过 Nginx 或构建工具注入，覆盖此处配置
 */
window.__ENV__ = window.__ENV__ || {
    VITE_SUPABASE_URL: 'https://bhxfpkcfbwxlnziepikw.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'sb_publishable_g9IJqFl2Mqr0wB-Sx_WR9w_KdeRCT40',
};
