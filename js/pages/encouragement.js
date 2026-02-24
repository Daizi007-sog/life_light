/**
 * 鼓励话语展示
 */
import { initSupabase, getSupabase } from '../supabase-client.js';

export async function renderEncouragementPage(container) {
    await initSupabase();
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    container.innerHTML = `
        <div class="page">
            <div class="card">
                <h2 class="card-title">今日鼓励</h2>
                <p style="color:var(--color-text-muted);font-size:var(--font-size-sm);margin-bottom:1rem">
                    根据你的用户画像，每 24 小时为你生成一句鼓励话语。
                </p>
                <div id="todayEncouragement" class="card" style="background:linear-gradient(135deg,#f5f7fa 0%,#e4e8ec 100%)">
                    <p id="encouragementText" class="loading">加载中...</p>
                </div>
            </div>
            <div class="card" style="margin-top:1rem">
                <h3 class="card-title">历史记录</h3>
                <div id="encouragementHistory"></div>
            </div>
        </div>
    `;

    const textEl = container.querySelector('#encouragementText');
    const historyEl = container.querySelector('#encouragementHistory');

    const { data: latest } = await supabase
        .from('encouragement_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single();

    if (latest?.content) {
        textEl.textContent = latest.content;
        textEl.classList.remove('loading');
    } else {
        textEl.innerHTML = '<span class="spinner"></span><br>暂无今日鼓励，定时任务将每 24h 自动生成。';
    }

    const { data: history } = await supabase
        .from('encouragement_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false })
        .limit(10);

    historyEl.innerHTML = history?.length
        ? history.map((h) => `
            <div style="padding:0.75rem 0;border-bottom:1px solid var(--color-border)">
                <p style="margin-bottom:0.25rem">${h.content}</p>
                <p style="font-size:var(--font-size-xs);color:var(--color-text-muted)">${new Date(h.generated_at).toLocaleString('zh-CN')}</p>
            </div>
        `).join('')
        : '<p class="empty-state">暂无历史记录</p>';
}
