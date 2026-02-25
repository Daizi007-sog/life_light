/**
 * 应用入口、路由、初始化
 * 超时保护：getSession 3 秒无响应则进入游客模式；本地存储损坏时自动清除并重载
 */
import { initSupabase } from './supabase-client.js';
import { getCurrentUser, safeGetCurrentUser, onAuthStateChange } from './auth.js';
import { renderLoginPage } from './pages/login.js';
import { renderHomePage } from './pages/home.js';
import { renderProfilePage } from './pages/profile.js';
import { renderScriptureCardPage } from './pages/scripture-card.js';
import { renderEncouragementPage } from './pages/encouragement.js';
import { renderInterpretationPage } from './pages/interpretation.js';

const routes = {
    '/': renderHomePage,
    '/login': renderLoginPage,
    '/profile': renderProfilePage,
    '/scripture-card': renderScriptureCardPage,
    '/encouragement': renderEncouragementPage,
    '/interpretation': renderInterpretationPage,
};

const INIT_FALLBACK_MS = 4000;

let currentUser = null;
let initDone = false;

async function init() {
    await initSupabase();
    const fallback = setTimeout(() => {
        if (!initDone) {
            initDone = true;
            currentUser = null;
            console.warn('初始化超时，进入游客模式');
            renderNav();
            handleRoute();
        }
    }, INIT_FALLBACK_MS);
    try {
        currentUser = await safeGetCurrentUser();
    } catch {
        currentUser = null;
    } finally {
        if (!initDone) {
            initDone = true;
            clearTimeout(fallback);
            renderNav();
            handleRoute();
        }
    }
    onAuthStateChange?.((event) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
            getCurrentUser().then((u) => {
                currentUser = u;
                renderNav();
                handleRoute();
            });
        }
    });
}

function renderNav() {
    const nav = document.getElementById('navTabs');
    if (!nav) return;
    const items = currentUser
        ? [
            { path: '/', label: '首页' },
            { path: '/scripture-card', label: '经文卡片' },
            { path: '/encouragement', label: '鼓励话语' },
            { path: '/interpretation', label: '经文解读' },
            { path: '/profile', label: '设置' },
        ]
        : [
            { path: '/', label: '首页' },
            { path: '/login', label: '登录' },
        ];
    nav.innerHTML = items
        .map(
            (item) =>
                `<a href="${item.path}" data-route="${item.path}" class="${getPath() === item.path ? 'active' : ''}">${item.label}</a>`
        )
        .join('');
    nav.querySelectorAll('a').forEach((a) => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            navigate(a.dataset.route);
        });
    });
}

function getPath() {
    return window.location.hash.slice(1) || '/';
}

function navigate(path) {
    window.location.hash = path || '/';
    handleRoute();
}

function handleRoute() {
    const path = getPath();
    const main = document.getElementById('mainContent');
    if (!main) return;

    const handler = routes[path] || routes['/'];
    if (path !== '/login' && !currentUser && path !== '/') {
        main.innerHTML = '<div class="page"><p class="loading">请先<a href="#/login" data-route="/login">登录</a></p></div>';
        document.querySelector('[data-route="/login"]')?.addEventListener('click', (e) => {
            e.preventDefault();
            navigate('/login');
        });
        return;
    }
    handler(main).catch((err) => {
        main.innerHTML = `<div class="page"><p class="error-msg">加载失败: ${err.message}</p></div>`;
    });
}

window.addEventListener('hashchange', () => {
    renderNav();
    handleRoute();
});

init();
