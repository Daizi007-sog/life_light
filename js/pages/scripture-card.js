/**
 * 经文卡片制作、分享
 */
import { initSupabase, getSupabase } from '../supabase-client.js';

// 印花图层：预留 Supabase Storage 链接坑位，后续替换为实际 URL
const FLORAL_PATTERN_URL = 'assets/placeholder-card.svg';

// 第四个模板中间层装饰图形（public/card_moban4/zhuangshi.png）
const TEMPLATE4_DECOR_URL = 'card_moban4/zhuangshi.png';

const CARD_TEMPLATES = [
    { id: 'default', name: '默认', image: 'assets/placeholder-card.svg' },
    { id: 'warm', name: '温暖', image: 'assets/placeholder-card.svg' },
    { id: 'minimal', name: '简约', image: 'assets/placeholder-card.svg' },
    { id: 'floral', name: '印花', image: 'assets/placeholder-card.svg', patternUrl: FLORAL_PATTERN_URL },
    { id: 'benediction', name: '福份', image: 'assets/placeholder-card.svg', decorUrl: TEMPLATE4_DECOR_URL },
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
    const templateOptions = container.querySelector('#templateOptions');
    const saveCardBtn = container.querySelector('#saveCardBtn');
    const shareBtn = container.querySelector('#shareBtn');
    const cardHistory = container.querySelector('#cardHistory');

    templateOptions.innerHTML = CARD_TEMPLATES.map((t) => {
        const pattern = t.patternUrl ? ` data-pattern="${t.patternUrl}"` : '';
        const deco = t.decoUrl ? ` data-deco="${t.decoUrl}"` : '';
        return `<button type="button" class="option-btn" data-id="${t.id}" data-img="${t.image}"${pattern}${deco}>${t.name}</button>`;
    }).join('');

    /** 简单 HTML 转义，防止 XSS */
    function escapeHtml(s) {
        if (!s) return '';
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /** 根据当前模板和结果渲染预览区域 */
    function renderPreviewCard(templateId, data) {
        const tpl = CARD_TEMPLATES.find((t) => t.id === templateId) || CARD_TEMPLATES[0];
        const scripture = escapeHtml(data?.scripture_content || data?.text || '暂无内容');
        const ref = escapeHtml(data?.reference || '');
        const aiTitle = escapeHtml(data?.ai_text || '');
        const previewCard = container.querySelector('#previewCard');

        if (templateId === 'floral') {
            const patternUrl = data?.image_url || tpl.patternUrl || FLORAL_PATTERN_URL;
            previewCard.className = 'scripture-card scripture-card--floral';
            previewCard.innerHTML = `
                <div class="scripture-card-pattern" id="previewPattern" style="background-image: url('${patternUrl}')"></div>
                <div class="scripture-card-white-box">
                    <p class="scripture-card-title" id="previewTitle">"${aiTitle}"</p>
                    <p class="scripture-card-text" id="previewText">${scripture}</p>
                    <p class="scripture-card-ref" id="previewRef">${ref}</p>
                </div>
            `;
        } else if (templateId === 'benediction') {
            const imgUrl = data?.image_url || tpl.image || 'assets/placeholder-card.svg';
            const decoUrl = tpl.decoUrl || TEMPLATE4_DECOR_URL;
            previewCard.className = 'scripture-card scripture-card--benediction';
            previewCard.innerHTML = `
                <div class="scripture-card-bg">
                    <img src="${imgUrl}" alt="卡片背景" class="scripture-card-bg-img">
                </div>
                <div class="scripture-card-deco-layer">
                    <img src="${decoUrl}" alt="装饰" class="scripture-card-deco-img">
                </div>
                <div class="scripture-card-benediction-text">
                    <p class="scripture-card-title">"${aiTitle}"</p>
                    <p class="scripture-card-text">${scripture}</p>
                    <p class="scripture-card-ref">${ref}</p>
                </div>
            `;
        } else {
            const imgUrl = data?.image_url || tpl.image || 'assets/placeholder-card.svg';
            previewCard.className = 'scripture-card';
            previewCard.innerHTML = `
                <img class="scripture-card-image" id="previewImage" src="${imgUrl}" alt="卡片背景">
                <div class="scripture-card-content">
                    <p class="scripture-card-text" id="previewText">${scripture}</p>
                    <p class="scripture-card-ref" id="previewRef">${ref}</p>
                </div>
            `;
        }
    }

    templateOptions.querySelectorAll('.option-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            templateOptions.querySelectorAll('.option-btn').forEach((b) => b.classList.remove('selected'));
            btn.classList.add('selected');
            renderPreviewCard(btn.dataset.id, currentResult);
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
            cardPreview.style.display = 'block';
            templateOptions.querySelectorAll('.option-btn').forEach((b) => b.classList.remove('selected'));
            templateOptions.querySelector('.option-btn[data-id="default"]')?.classList.add('selected');
            renderPreviewCard('default', data);
        } catch (err) {
            console.error(err);
            currentResult = { scripture_content: '生成失败，请检查 Edge Function 是否已部署。' + (err.message || ''), reference: '', ai_text: '' };
            cardPreview.style.display = 'block';
            templateOptions.querySelectorAll('.option-btn').forEach((b) => b.classList.remove('selected'));
            templateOptions.querySelector('.option-btn')?.classList.add('selected');
            renderPreviewCard(CARD_TEMPLATES[0].id, currentResult);
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = '生成经文卡片';
        }
    });

    saveCardBtn.addEventListener('click', async () => {
        if (!currentResult) return;
        const sel = templateOptions.querySelector('.option-btn.selected');
        const tplId = sel?.dataset.id || 'default';
        const tpl = CARD_TEMPLATES.find((t) => t.id === tplId) || CARD_TEMPLATES[0];
        const effectiveImageUrl = tplId === 'floral'
            ? (currentResult.image_url || tpl.patternUrl || FLORAL_PATTERN_URL)
            : tplId === 'benediction'
                ? (currentResult.image_url || tpl.image || 'assets/placeholder-card.svg')
                : (container.querySelector('#previewImage')?.src || tpl.image || 'assets/placeholder-card.svg');
        try {
            const { error } = await supabase.from('scripture_cards').insert({
                user_id: user.id,
                user_input: container.querySelector('#userInput').value.trim(),
                scripture_content: currentResult.scripture_content || currentResult.text,
                ai_generated_text: currentResult.ai_text,
                template_id: tplId,
                image_url: effectiveImageUrl,
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
        const text = (currentResult?.scripture_content || currentResult?.text || '') + '\n' + (currentResult?.reference || '');
        if (navigator.share) {
            try {
                await navigator.share({
                    title: '经文卡片 - 生命之光',
                    text,
                    url: window.location.href,
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    navigator.clipboard?.writeText(text);
                    alert('已复制到剪贴板');
                }
            }
        } else {
            navigator.clipboard?.writeText(text);
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
