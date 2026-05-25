const postsContainer = document.getElementById('postsContainer');

async function loadPosts() {
    postsContainer.innerHTML = '<div class="loading-skeleton"><i class="fas fa-spinner fa-pulse"></i> 拾取星光中...</div>';
    const { data, error } = await supabase
        .from('posts')
        .select('id, title, content, created_at, views')
        .order('created_at', { ascending: false });
    
    if (error) {
        postsContainer.innerHTML = '<div>加载失败，请刷新</div>';
        return;
    }
    if (!data.length) {
        postsContainer.innerHTML = '<div class="loading-skeleton">✨ 还没有文章，去「写文章」发布吧</div>';
        return;
    }

    postsContainer.innerHTML = data.map(post => {
        const excerpt = post.content.replace(/[#*`>]/g, '').slice(0, 120) + '...';
        return `
            <article class="post-preview">
                <h2 class="post-title"><a href="post.html?id=${post.id}">${escapeHtml(post.title)}</a></h2>
                <div class="post-meta">
                    <span><i class="far fa-calendar-alt"></i> ${formatDate(post.created_at)}</span>
                    <span><i class="fas fa-eye"></i> ${post.views || 0} 次阅读</span>
                </div>
                <div class="post-excerpt">${escapeHtml(excerpt)}</div>
                <a href="post.html?id=${post.id}" class="read-more">阅读全文 <i class="fas fa-arrow-right"></i></a>
            </article>
        `;
    }).join('');
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

loadPosts();
