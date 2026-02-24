/**
 * 用户画像、问卷、设置
 */
import { getSupabase, initSupabase } from '../supabase-client.js';

const QUESTIONNAIRE = [
    { id: 'life_stage', label: '你目前的人生阶段', options: ['学生', '职场新人', '职场资深', '退休', '其他'] },
    { id: 'prayer_freq', label: '灵修频率', options: ['每日', '每周几次', '偶尔', '刚开始'] },
    { id: 'concern', label: '近期最关心的主题', options: ['工作', '家庭', '健康', '关系', '信心成长', '其他'] },
];

export async function renderProfilePage(container) {
    await initSupabase();
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('user_profiles').select('*').eq('user_id', user.id).single();

    container.innerHTML = `
        <div class="page">
            <div class="card">
                <h2 class="card-title">用户画像</h2>
                <p style="color:var(--color-text-muted);font-size:var(--font-size-sm);margin-bottom:1rem">
                    完善信息后，AI 将为你生成更贴合的灵修内容。
                </p>
                <div class="form-group">
                    <label for="nickname">昵称</label>
                    <input type="text" id="nickname" value="${profile?.nickname || ''}" placeholder="你的昵称">
                </div>
                ${QUESTIONNAIRE.map(
                    (q) => `
                    <div class="form-group">
                        <label>${q.label}</label>
                        <div class="option-group" data-id="${q.id}">
                            ${q.options.map((opt) => {
                                const selected = profile?.questionnaire_answers?.[q.id] === opt;
                                return `<button type="button" class="option-btn ${selected ? 'selected' : ''}" data-value="${opt}">${opt}</button>`;
                            }).join('')}
                        </div>
                    </div>
                `
                ).join('')}
                <p id="profileError" class="error-msg" style="display:none"></p>
                <button type="button" class="btn btn-primary btn-block" id="saveProfile">保存</button>
            </div>
        </div>
    `;

    const answers = { ...(profile?.questionnaire_answers || {}) };
    container.querySelectorAll('.option-group').forEach((group) => {
        const id = group.dataset.id;
        group.querySelectorAll('.option-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                group.querySelectorAll('.option-btn').forEach((b) => b.classList.remove('selected'));
                btn.classList.add('selected');
                answers[id] = btn.dataset.value;
            });
        });
    });

    container.querySelector('#saveProfile').addEventListener('click', async () => {
        const nickname = container.querySelector('#nickname').value.trim();
        const errorEl = container.querySelector('#profileError');
        errorEl.style.display = 'none';

        try {
            const { error } = await supabase.from('user_profiles').upsert(
                {
                    user_id: user.id,
                    nickname: nickname || null,
                    questionnaire_answers: answers,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id' }
            );
            if (error) throw error;
            errorEl.textContent = '保存成功';
            errorEl.style.color = 'var(--color-secondary)';
            errorEl.style.display = 'block';
        } catch (err) {
            errorEl.textContent = err.message || '保存失败';
            errorEl.style.display = 'block';
        }
    });
}
