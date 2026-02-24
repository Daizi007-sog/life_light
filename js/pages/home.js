/**
 * 首页
 */
import { getCurrentUser } from '../auth.js';

export async function renderHomePage(container) {
    const user = await getCurrentUser();
    container.innerHTML = `
        <div class="page">
            <div class="card">
                <h2 class="card-title">欢迎${user ? '回来' : ''}</h2>
                <p style="color:var(--color-text-muted);margin-bottom:1rem">
                    ${user ? '开始今日的灵修之旅吧。' : '登录后可使用完整功能。'}
                </p>
                ${user ? `
                    <div class="card-grid">
                        <a href="#/scripture-card" data-route="/scripture-card" class="card" style="text-decoration:none;color:inherit">
                            <strong>经文卡片</strong>
                            <p class="form-group" style="margin:0;font-size:var(--font-size-sm);color:var(--color-text-muted)">制作个性化经文卡片并分享</p>
                        </a>
                        <a href="#/encouragement" data-route="/encouragement" class="card" style="text-decoration:none;color:inherit">
                            <strong>鼓励话语</strong>
                            <p class="form-group" style="margin:0;font-size:var(--font-size-sm);color:var(--color-text-muted)">每日为你生成的鼓励</p>
                        </a>
                        <a href="#/interpretation" data-route="/interpretation" class="card" style="text-decoration:none;color:inherit">
                            <strong>经文解读</strong>
                            <p class="form-group" style="margin:0;font-size:var(--font-size-sm);color:var(--color-text-muted)">深度解读选中的经文</p>
                        </a>
                    </div>
                ` : `
                    <a href="#/login" data-route="/login" class="btn btn-primary btn-block">登录</a>
                `}
            </div>
        </div>
    `;

    container.querySelectorAll('[data-route]').forEach((a) => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = a.dataset.route;
            window.dispatchEvent(new HashChangeEvent('hashchange'));
        });
    });
}
