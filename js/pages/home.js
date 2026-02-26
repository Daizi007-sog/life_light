/**
 * 首页 - 鼓励话语 + 骨架屏
 */
import { getCurrentUser } from '../auth.js';
import { fetchEncouragement } from '../dify_update.js';

const PLACEHOLDER = '今日愿你平安，在祂的恩典中得享安息。';

function getGreeting() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return '早上好';
    if (h >= 12 && h < 18) return '下午好';
    return '晚上好';
}

function skeletonHtml() {
    return `
        <div class="encouragement-skeleton" style="
            background: linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 75%);
            background-size: 200% 100%;
            animation: skeleton-shimmer 1.5s ease-in-out infinite;
            height: 100px;
            border-radius: 8px;
            margin-bottom: 1rem;
        "></div>
    `;
}

export async function renderHomePage(container) {
    const user = await getCurrentUser();
    const greeting = getGreeting();
    const nickname = user?.user_metadata?.username || '朋友';

    container.innerHTML = `
        <div class="page">
            <div class="card">
                <h2 class="card-title">${greeting} ${nickname}</h2>
                <p style="color:var(--color-text-muted);margin-bottom:1rem">今天的你还好吗</p>
                <div id="encouragementCard" class="encouragement-card" style="min-height:100px;margin-bottom:1rem">
                    ${skeletonHtml()}
                </div>
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

    const cardEl = document.getElementById('encouragementCard');
    if (cardEl) {
        try {
            const { content } = await fetchEncouragement();
            cardEl.innerHTML = `<p style="white-space:pre-wrap;line-height:1.8;color:var(--color-text);margin:0">${escapeHtml(content)}</p>`;
        } catch (err) {
            cardEl.innerHTML = `<p style="white-space:pre-wrap;line-height:1.8;color:var(--color-text-muted);margin:0">${escapeHtml(PLACEHOLDER)}</p>`;
        }
    }

    container.querySelectorAll('[data-route]').forEach((a) => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = a.dataset.route;
            window.dispatchEvent(new HashChangeEvent('hashchange'));
        });
    });
}

function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}
