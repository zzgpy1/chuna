const authPanel = document.getElementById('authPanel');
const publishPanel = document.getElementById('publishPanel');
let currentUser = null;

// 监听认证状态
supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
        currentUser = session.user;
        authPanel.style.display = 'none';
        publishPanel.style.display = 'block';
        document.getElementById('postTitle').value = '';
        document.getElementById('postContent').value = '';
        document.getElementById('livePreview').innerHTML = '';
    } else {
        currentUser = null;
        authPanel.style.display = 'block';
        publishPanel.style.display = 'none';
        renderAuthForm();
    }
});

function renderAuthForm() {
    authPanel.innerHTML = `
        <div class="auth-tabs">
            <button id="loginTab" class="active-tab">登录</button>
            <button id="signupTab">注册</button>
        </div>
        <div id="loginForm" class="auth-form">
            <input type="email" id="loginEmail" placeholder="邮箱" class="title-input">
            <input type="password" id="loginPassword" placeholder="密码" class="title-input">
            <button id="doLogin" class="btn-primary">登录</button>
        </div>
        <div id="signupForm" style="display:none;" class="auth-form">
            <input type="email" id="signupEmail" placeholder="邮箱" class="title-input">
            <input type="password" id="signupPassword" placeholder="密码（至少6位）" class="title-input">
            <button id="doSignup" class="btn-primary">注册并登录</button>
        </div>
        <p class="note">注册后即可永久发布文章（一人博客）</p>
    `;
    document.getElementById('loginTab').onclick = () => toggleAuth('login');
    document.getElementById('signupTab').onclick = () => toggleAuth('signup');
    document.getElementById('doLogin')?.addEventListener('click', login);
    document.getElementById('doSignup')?.addEventListener('click', signup);
}

function toggleAuth(type) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const loginTab = document.getElementById('loginTab');
    const signupTab = document.getElementById('signupTab');
    if (type === 'login') {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        loginTab.classList.add('active-tab');
        signupTab.classList.remove('active-tab');
    } else {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        signupTab.classList.add('active-tab');
        loginTab.classList.remove('active-tab');
    }
}

async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert('登录失败: ' + error.message);
}

async function signup() {
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    if (password.length < 6) {
        alert('密码至少6位');
        return;
    }
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert('注册失败: ' + error.message);
    else alert('注册成功！已自动登录');
}

// 发布文章逻辑
document.addEventListener('click', async (e) => {
    if (e.target.id === 'publishBtn') {
        const title = document.getElementById('postTitle').value.trim();
        const content = document.getElementById('postContent').value.trim();
        if (!title || !content) {
            alert('标题和内容不能为空');
            return;
        }
        if (!currentUser) {
            alert('请先登录');
            return;
        }
        const { error } = await supabase.from('posts').insert({
            title: title,
            content: content,
            user_id: currentUser.id,
            views: 0
        });
        if (error) {
            alert('发布失败: ' + error.message);
        } else {
            alert('✨ 发布成功！返回首页查看');
            document.getElementById('postTitle').value = '';
            document.getElementById('postContent').value = '';
            document.getElementById('livePreview').innerHTML = '';
        }
    }
    if (e.target.id === 'logoutBtn') {
        await supabase.auth.signOut();
        alert('已退出登录');
    }
});

// 实时预览
document.addEventListener('input', (e) => {
    if (e.target.id === 'postContent') {
        const md = e.target.value;
        (async () => {
            const html = await renderMarkdown(md);
            document.getElementById('livePreview').innerHTML = html;
            hljs.highlightAll();
        })();
    }
});

// 样式增强
const style = document.createElement('style');
style.textContent = `.active-tab { background: #b87333; color: white; border-radius: 60px; padding: 6px 18px; border:none; margin:0 6px; } .auth-tabs { display:flex; gap:12px; margin-bottom:1.5rem; } .note { margin-top:1rem; font-size:0.8rem; color:#8f7e6b; }`;
document.head.appendChild(style);

// 初始化检查当前会话
(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
        currentUser = session.user;
        authPanel.style.display = 'none';
        publishPanel.style.display = 'block';
    } else {
        renderAuthForm();
    }
})();
