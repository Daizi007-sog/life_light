/**
 * 经文解读
 */
import { initSupabase, getSupabase } from '../supabase-client.js';

export async function renderInterpretationPage(container) {
    await initSupabase();
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    container.innerHTML = `
        <div class="page">
            <div class="card">
                <h2 class="card-title">经文解读</h2>
                <p style="color:var(--color-text-muted);font-size:var(--font-size-sm);margin-bottom:1rem">
                    输入或选择一段经文，AI 将为你深度解读，包括洞察、行动指引和背景概览。
                </p>
                <div class="form-group">
                    <label for="scriptureInput">经文内容（如：约翰福音 3:16）</label>
                    <textarea id="scriptureInput" placeholder="输入经文或引用，例如：神爱世人，甚至将他的独生子赐给他们..."></textarea>
                </div>
                <button type="button" class="btn btn-primary btn-block" id="interpretBtn">解读</button>
            </div>
            <div id="interpretResult" class="card" style="display:none;margin-top:1rem">
                <h3 class="card-title">解读结果</h3>
                <div id="interpretContent"></div>
                <div id="interpretImage" style="margin-top:1rem"></div>
            </div>
        </div>
    `;

    const interpretBtn = container.querySelector('#interpretBtn');
    const resultDiv = container.querySelector('#interpretResult');
    const contentDiv = container.querySelector('#interpretContent');
    const imageDiv = container.querySelector('#interpretImage');

    interpretBtn.addEventListener('click', async () => {
        const scripture = container.querySelector('#scriptureInput').value.trim();
        if (!scripture) {
            alert('请先输入经文内容');
            return;
        }
        interpretBtn.disabled = true;
        interpretBtn.textContent = '解读中...';
        resultDiv.style.display = 'block';
        contentDiv.innerHTML = '<div class="loading"><span class="spinner"></span><br>AI 正在解读...</div>';
        imageDiv.innerHTML = '';

        try {
            const { data, error } = await supabase.functions.invoke('scripture-interpret', {
                body: { scripture },
            });
            if (error) throw error;

            const insight = data?.insight || data?.洞察 || '';
            const action = data?.action || data?.行动指引 || '';
            const background = data?.background || data?.经文背景 || '';

            contentDiv.innerHTML = `
                ${insight ? `<section style="margin-bottom:1rem"><h4 style="font-size:var(--font-size-sm);color:var(--color-primary);margin-bottom:0.5rem">洞察</h4><p>${insight}</p></section>` : ''}
                ${action ? `<section style="margin-bottom:1rem"><h4 style="font-size:var(--font-size-sm);color:var(--color-primary);margin-bottom:0.5rem">行动指引</h4><p>${action}</p></section>` : ''}
                ${background ? `<section><h4 style="font-size:var(--font-size-sm);color:var(--color-primary);margin-bottom:0.5rem">经文背景</h4><p>${background}</p></section>` : ''}
                ${!insight && !action && !background ? `<p>${data?.text || JSON.stringify(data) || '暂无解读内容'}</p>` : ''}
            `;

            if (data?.image_url) {
                imageDiv.innerHTML = `<img src="${data.image_url}" alt="背景图" style="width:100%;border-radius:var(--radius-md)">`;
            }
        } catch (err) {
            console.error(err);
            contentDiv.innerHTML = `<p class="error-msg">解读失败：${err.message || '请检查 Edge Function 是否已部署'}</p>`;
        } finally {
            interpretBtn.disabled = false;
            interpretBtn.textContent = '解读';
        }
    });
}
