/**
 * 经文卡片制作、分享
 */
import { initSupabase, getSupabase } from '../supabase-client.js';

const CARD_TEMPLATES = [
    { id: 'default', name: '默认', image: 'assets/placeholder-card.svg' },
    { id: 'warm', name: '温暖', image: 'assets/placeholder-card.svg' },
    { id: 'minimal', name: '简约', image: 'assets/placeholder-card.svg' },
];

export async function renderScriptureCardPage(container) {
    await initSupabase();
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    container.innerHTML = `
        <div class="page">
            <div class="card">
                <h2 class="card-title">制作经文卡片</h2>
                <p style="color:var(--color-text-muted);font-size:var(--font-size-sm);margin-bottom:1rem">
                    输入你此刻的心情或状态，AI 将为你推荐合适的经文并生成卡片。
                </p>
                <div class="form-group">
                    <label for="userInput">此刻的心情或状态</label>
                    <textarea id="userInput" placeholder="例如：今天工作压力很大，需要安慰..."></textarea>
                </div>
                <button type="button" class="btn btn-primary btn-block" id="generateBtn">生成经文卡片</button>
            </div>
            <div id="cardPreview" class="card" style="display:none;margin-top:1rem">
                <h3 class="card-title">预览</h3>
                <div class="scripture-card" id="previewCard">
                    <img class="scripture-card-image" id="previewImage" src="assets/placeholder-card.svg" alt="卡片背景">
                    <div class="scripture-card-content">
                        <p class="scripture-card-text" id="previewText"></p>
                        <p class="scripture-card-ref" id="previewRef"></p>
                    </div>
                </div>
                <div class="form-group" style="margin-top:1rem">
                    <label>切换模板</label>
                    <div class="option-group" id="templateOptions"></div>
                </div>
                <button type="button" class="btn btn-primary btn-block" id="saveCardBtn" style="margin-top:0.5rem">保存到历史</button>
                <button type="button" class="btn btn-secondary btn-block" id="shareBtn" style="margin-top:0.5rem">分享</button>
            </div>
            <div class="card" style="margin-top:1rem">
                <h3 class="card-title">历史卡片</h3>
                <div id="cardHistory" class="card-grid"></div>
            </div>
        </div>
    `;

    let currentResult = null;

    const generateBtn = container.querySelector('#generateBtn');
    const cardPreview = container.querySelector('#cardPreview');
    const previewText = container.querySelector('#previewText');
    const previewRef = container.querySelector('#previewRef');
    const previewImage = container.querySelector('#previewImage');
    const templateOptions = container.querySelector('#templateOptions');
    const saveCardBtn = container.querySelector('#saveCardBtn');
    const shareBtn = container.querySelector('#shareBtn');
    const cardHistory = container.querySelector('#cardHistory');

    templateOptions.innerHTML = CARD_TEMPLATES.map((t) => `<button type="button" class="option-btn" data-id="${t.id}" data-img="${t.image}">${t.name}</button>`).join('');
    templateOptions.querySelectorAll('.option-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            templateOptions.querySelectorAll('.option-btn').forEach((b) => b.classList.remove('selected'));
            btn.classList.add('selected');
            previewImage.src = btn.dataset.img || 'assets/placeholder-card.svg';
        });
    });

    generateBtn.addEventListener('click', async () => {
        const userInput = container.querySelector('#userInput').value.trim();
        if (!userInput) {
            alert('请先输入心情或状态');
            return;
        }
        generateBtn.disabled = true;
        generateBtn.textContent = '生成中...';

        try {
            const { data, error } = await supabase.functions.invoke('scripture-card-generate', {
                body: { user_input: userInput },
            });
            if (error) throw error;
            currentResult = data;
            previewText.textContent = data?.scripture_content || data?.text || '暂无内容';
            previewRef.textContent = data?.reference || '';
            previewImage.src = data?.image_url || CARD_TEMPLATES[0].image || 'assets/placeholder-card.svg';
            cardPreview.style.display = 'block';
            templateOptions.querySelector('.option-btn')?.classList.add('selected');
        } catch (err) {
            console.error(err);
            previewText.textContent = '生成失败，请检查 Edge Function 是否已部署。' + (err.message || '');
            cardPreview.style.display = 'block';
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = '生成经文卡片';
        }
    });

    saveCardBtn.addEventListener('click', async () => {
        if (!currentResult) return;
        try {
            const { error } = await supabase.from('scripture_cards').insert({
                user_id: user.id,
                user_input: container.querySelector('#userInput').value.trim(),
                scripture_content: currentResult.scripture_content || currentResult.text,
                ai_generated_text: currentResult.ai_text,
                template_id: templateOptions.querySelector('.option-btn.selected')?.dataset.id || 'default',
                image_url: previewImage.src,
                metadata: {},
            });
            if (error) throw error;
            alert('已保存');
            loadHistory();
        } catch (err) {
            alert('保存失败: ' + (err.message || ''));
        }
    });

    shareBtn.addEventListener('click', async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: '经文卡片 - 生命之光',
                    text: previewText.textContent + '\n' + previewRef.textContent,
                    url: window.location.href,
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    navigator.clipboard?.writeText(previewText.textContent + '\n' + previewRef.textContent);
                    alert('已复制到剪贴板');
                }
            }
        } else {
            navigator.clipboard?.writeText(previewText.textContent + '\n' + previewRef.textContent);
            alert('已复制到剪贴板');
        }
    });

    async function loadHistory() {
        const { data } = await supabase.from('scripture_cards').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
        cardHistory.innerHTML = data?.length
            ? data.map((c) => `
                <div class="scripture-card">
                    <img class="scripture-card-image" src="${c.image_url || 'assets/placeholder-card.svg'}" alt="卡片">
                    <div class="scripture-card-content">
                        <p class="scripture-card-text">${(c.scripture_content || '').slice(0, 80)}${(c.scripture_content || '').length > 80 ? '...' : ''}</p>
                        <p class="scripture-card-ref">${new Date(c.created_at).toLocaleDateString('zh-CN')}</p>
                    </div>
                </div>
            `).join('')
            : '<p class="empty-state">暂无历史卡片</p>';
    }

    loadHistory();
}
