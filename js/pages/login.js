/**
 * 登录/注册页面
 */
import { signIn, signUp } from '../auth.js';

export async function renderLoginPage(container) {
    container.innerHTML = `
        <div class="page">
            <div class="card">
                <h2 class="card-title">登录 / 注册</h2>
                <form id="authForm" class="auth-form">
                    <div class="form-group">
                        <label for="email">邮箱</label>
                        <input type="email" id="email" required placeholder="your@email.com">
                    </div>
                    <div class="form-group">
                        <label for="password">密码</label>
                        <input type="password" id="password" required placeholder="至少6位">
                    </div>
                    <p id="authError" class="error-msg" style="display:none"></p>
                    <button type="submit" class="btn btn-primary btn-block" id="submitBtn">登录</button>
                    <button type="button" class="btn btn-secondary btn-block" id="toggleMode" style="margin-top:0.5rem">切换到注册</button>
                </form>
            </div>
        </div>
    `;

    const form = container.querySelector('#authForm');
    const errorEl = container.querySelector('#authError');
    const submitBtn = container.querySelector('#submitBtn');
    const toggleBtn = container.querySelector('#toggleMode');
    let isSignUp = false;

    toggleBtn.addEventListener('click', () => {
        isSignUp = !isSignUp;
        submitBtn.textContent = isSignUp ? '注册' : '登录';
        toggleBtn.textContent = isSignUp ? '切换到登录' : '切换到注册';
        errorEl.style.display = 'none';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = container.querySelector('#email').value.trim();
        const password = container.querySelector('#password').value;
        errorEl.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.textContent = '处理中...';

        try {
            if (isSignUp) {
                await signUp(email, password);
                errorEl.textContent = '注册成功，请查收邮件验证（若启用）';
                errorEl.style.display = 'block';
                errorEl.style.color = 'var(--color-secondary)';
            } else {
                await signIn(email, password);
                window.location.hash = '/';
                window.location.reload();
            }
        } catch (err) {
            errorEl.textContent = err.message || '操作失败';
            errorEl.style.display = 'block';
            errorEl.style.color = 'var(--color-accent)';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = isSignUp ? '注册' : '登录';
        }
    });
}
