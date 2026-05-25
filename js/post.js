const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id');
const container = document.getElementById('postDetail');

async function fetchAndRender() {
    if (!postId) {
        container.innerHTML = '<div>无效的文章ID</div>';
        return;
    }
    // 获取文章数据
    const { data: post, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();
    
    if (error || !post) {
        container.innerHTML = '<div>文章未找到</div>';
        return;
    }

    // 增加阅读计数
    await supabase
        .from('posts')
        .update({ views: (post.views || 0) + 1 })
        .eq('id', postId);

    const htmlContent = await renderMarkdown(post.content);
    container.innerHTML = `
        <div class="full-post">
            <div class="post-header">
                <h1>${escapeHtml(post.title)}</h1>
                <div class="post-meta">
                    <span><i class="far fa-calendar-alt"></i> ${formatDate(post.created_at)}</span>
                    <span><i class="fas fa-eye"></i> ${(post.views || 0) + 1} 次阅读</span>
                </div>
            </div>
            <div class="post-body markdown-body">${htmlContent}</div>
        </div>
    `;
    hljs.highlightAll();
}

function escapeHtml(str) { return str.replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m])); }
fetchAndRender();
