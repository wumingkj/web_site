/**
 * Wuming Blog - 文章详情页脚本
 */

let currentPostId = null;
let currentUser = null;

async function initPostPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (!postId) {
        showError('文章不存在');
        return;
    }

    currentPostId = postId;

    // 检查登录状态
    await checkLoginStatus();

    try {
        const response = await WumingBlog.fetchAPI(`/post.php?id=${postId}`);

        if (!response || !response.success) {
            showError(response?.error || '加载失败');
            return;
        }

        const post = response.data;
        renderPost(post);
        updatePageTitle(post.title);
        
        // 加载评论
        loadComments(postId);
    } catch (error) {
        showError('加载失败');
    }
}

async function checkLoginStatus() {
    try {
        const res = await fetch('/blog/api/auth.php?action=check', {
            credentials: 'same-origin'
        });
        const data = await res.json();
        
        if (data.loggedin && data.user) {
            currentUser = data.user;
            renderCommentForm();
        } else {
            renderLoginPrompt();
        }
    } catch (err) {
        renderLoginPrompt();
    }
}

function renderLoginPrompt() {
    const formContainer = document.getElementById('comment-form');
    formContainer.innerHTML = `
        <div class="login-prompt">
            <div class="prompt-icon">🔐</div>
            <h3>登录后可评论</h3>
            <p>登录后解锁评论功能，与作者和其他读者互动</p>
            <a href="/blog/pages/login.html?redirect=${encodeURIComponent(window.location.href)}" class="login-btn">去登录</a>
        </div>
    `;
}

function renderCommentForm() {
    const formContainer = document.getElementById('comment-form');
    formContainer.innerHTML = `
        <div class="comment-user-info">
            <span class="user-avatar">${WumingBlog.renderAvatar(currentUser.avatar, 32)}</span>
            <span class="user-name">${escapeHtml(currentUser.username)}</span>
        </div>
        <input type="hidden" id="comment-post-id" value="${currentPostId}">
        <div class="form-row">
            <textarea id="comment-content" placeholder="写下你的评论... *" required maxlength="500" rows="4"></textarea>
        </div>
        <button type="submit" class="submit-btn">✨ 发表评论</button>
    `;
    
    // 重新绑定表单提交
    formContainer.addEventListener('submit', submitComment);
}

function renderPost(post) {
    // 标题
    document.getElementById('post-title').textContent = post.title;

    // 日期
    document.getElementById('post-date').innerHTML = `📅 ${WumingBlog.formatDate(post.created_at)}`;

    // 分类
    if (post.category) {
        const categoryEl = document.getElementById('post-category');
        categoryEl.style.display = 'inline';
        document.getElementById('category-link').href = `/blog/pages/archive.html?category=${post.category.slug}`;
        document.getElementById('category-link').textContent = post.category.name;
    }

    // 阅读数 - 动画计数
    const viewsEl = document.querySelector('#post-views .stat-num');
    if (viewsEl) {
        WumingBlog.animateNumber(viewsEl, post.views || 0);
    }

    // 评论数 - 动画计数
    const commentsEl = document.querySelector('#post-comments .stat-num');
    if (commentsEl) {
        WumingBlog.animateNumber(commentsEl, post.comments || 0);
    }

    // 3D阅读模式入口
    const threeDEntry = document.getElementById('post-3d-entry');
    if (threeDEntry) {
        threeDEntry.href = `/blog/pages/post3d.html?id=${post.id}`;
        threeDEntry.style.display = 'inline-flex';
    }

    // 标签
    const tagsContainer = document.getElementById('post-tags');
    if (post.tags && post.tags.length > 0) {
        tagsContainer.innerHTML = post.tags.map(tag =>
            `<a href="/blog/pages/archive.html?tag=${tag.slug}" class="tag" style="--tag-color: ${tag.color || '#4dabf7'}">${tag.name}</a>`
        ).join('');
    }

    // 内容 - 解析 Markdown
    const contentEl = document.getElementById('post-content');
    const content = post.content || post.excerpt || '暂无内容';
    if (typeof marked !== 'undefined') {
        contentEl.innerHTML = marked.parse(content);
    } else {
        contentEl.innerHTML = content;
    }

    // 构建大纲
    buildTOC();

    // 上一篇/下一篇
    if (post.prev) {
        const prevEl = document.getElementById('prev-post');
        prevEl.href = `/blog/pages/post.html?id=${post.prev.id}`;
        prevEl.querySelector('.nav-title').textContent = post.prev.title;
        prevEl.style.visibility = 'visible';
    }

    if (post.next) {
        const nextEl = document.getElementById('next-post');
        nextEl.href = `/blog/pages/post.html?id=${post.next.id}`;
        nextEl.querySelector('.nav-title').textContent = post.next.title;
        nextEl.style.visibility = 'visible';
    }
}

async function loadComments(postId) {
    try {
        const response = await WumingBlog.fetchAPI(`/comments.php?post_id=${postId}`);
        
        if (response && response.success) {
            renderComments(response.data);
            document.getElementById('comment-count').textContent = response.total;
            document.querySelector('#post-comments .stat-num').textContent = response.total;
        }
    } catch (error) {
        console.error('Load comments failed');
    }
}

function renderComments(comments) {
    const container = document.getElementById('comments-list');
    
    if (!comments || comments.length === 0) {
        container.innerHTML = '<p class="no-comments">暂无评论，快来抢沙发吧~ 💬</p>';
        return;
    }
    
    const html = comments.map(comment => {
        // 支持 Markdown 和换行
        let content = comment.content || '';
        if (typeof marked !== 'undefined') {
            // 使用 marked 解析，保留换行
            content = marked.parse(content, { breaks: true, gfm: true });
        } else {
            content = escapeHtml(content).replace(/\n/g, '<br>');
        }
        
        return `
            <div class="comment-item fade-in">
                <div class="comment-avatar">${WumingBlog.renderAvatar(comment.avatar, 50)}</div>
                <div class="comment-body">
                    <div class="comment-header">
                        <span class="comment-author">${escapeHtml(comment.user || comment.author || '匿名')}</span>
                        <span class="comment-date">${WumingBlog.formatDate(comment.created_at)}</span>
                    </div>
                    <div class="comment-content">${content}</div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function submitComment(e) {
    e.preventDefault();
    
    if (!currentUser) {
        Toast.warning('请先登录');
        return;
    }
    
    const postId = document.getElementById('comment-post-id').value;
    const content = document.getElementById('comment-content').value.trim();
    
    if (!content) {
        Toast.warning('请填写评论内容');
        return;
    }
    
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = '发表中...';
    
    try {
        const response = await fetch('/blog/api/comments.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ post_id: parseInt(postId), content })
        });
        
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('comment-content').value = '';
            loadComments(postId);
            Toast.success('评论发表成功');
        } else {
            Toast.error(result.message || result.error || '发表失败');
        }
    } catch (error) {
        Toast.error('发表失败，请稍后重试');
    }
    
    submitBtn.disabled = false;
    submitBtn.textContent = '✨ 发表评论';
}

function updatePageTitle(title) {
    document.title = `${title} | Wuming Blog`;
}

function buildTOC() {
    var tocList = document.getElementById('toc-list');
    if (!tocList) return;

    var contentEl = document.getElementById('post-content');
    if (!contentEl) return;

    var headings = contentEl.querySelectorAll('h2, h3');
    if (headings.length === 0) {
        document.getElementById('toc').style.display = 'none';
        return;
    }

    var html = '';
    headings.forEach(function (h, i) {
        var id = 'heading-' + i;
        h.id = id;
        var isH3 = h.tagName === 'H3';
        html += '<li><a href="#' + id + '" class="' + (isH3 ? 'toc-h3' : '') + '">' + h.textContent + '</a></li>';
    });
    tocList.innerHTML = html;

    var tocToggle = document.getElementById('toc-toggle');
    if (tocToggle) {
        tocToggle.addEventListener('click', function () {
            var toc = document.getElementById('toc');
            toc.classList.toggle('collapsed');
            tocToggle.textContent = toc.classList.contains('collapsed') ? '◀' : '▶';
        });
    }

    var tocLinks = tocList.querySelectorAll('a');
    tocLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            var target = document.getElementById(this.getAttribute('href').substring(1));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    var scrollTimer;
    window.addEventListener('scroll', function () {
        if (scrollTimer) clearTimeout(scrollTimer);
        scrollTimer = setTimeout(updateActiveTOC, 100);
    });

    updateActiveTOC();
}

function updateActiveTOC() {
    var tocLinks = document.querySelectorAll('#toc-list a');
    var headings = document.querySelectorAll('#post-content h2[id], #post-content h3[id]');
    if (!tocLinks.length || !headings.length) return;

    var currentIndex = -1;
    var scrollTop = window.scrollY + 100;
    headings.forEach(function (h, i) {
        if (h.offsetTop <= scrollTop) {
            currentIndex = i;
        }
    });

    tocLinks.forEach(function (link) {
        link.classList.remove('active');
    });

    if (currentIndex >= 0) {
        tocLinks[currentIndex].classList.add('active');
    }
}

function showError(message) {
    const container = document.querySelector('.post-detail-card');
    if (container) {
        container.innerHTML = `
            <div class="post-detail-header">
                <h1 class="post-detail-title">哎呀，${message} (╯°□°)╯</h1>
                <p style="text-align: center; color: var(--text-light); margin-top: 20px;">
                    <a href="/blog/" style="color: var(--primary);">返回首页</a>
                </p>
            </div>
        `;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPostPage);
} else {
    initPostPage();
}