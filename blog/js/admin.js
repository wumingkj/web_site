/**
 * Wuming Blog - 管理后台
 */

let currentUser = null;
let allCategories = [];
let allTags = [];

window.__navigate = window.__navigate || function (url) { window.location.href = url; };

// 初始化
async function initAdminPage() {
    await checkLogin();
    initNavigation();
    initPostModal();
    initLogout();
    initChangePassword();
    initPostFilter();
    loadPosts();
    loadCategoriesAndTags();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminPage);
} else {
    initAdminPage();
}

// 检查登录状态
async function checkLogin() {
    try {
        const res = await fetch('/blog/api/auth.php?action=check', {
            credentials: 'same-origin'
        });
        const data = await res.json();

        console.log('Admin check response:', data);

        // 检查是否登录
        if (!data.success || !data.loggedin || !data.user) {
            console.log('未登录，跳转到登录页');
            window.__navigate('/blog/pages/login.html');
            return;
        }

        // 检查是否是管理员
        if (data.user.role !== 'admin') {
            Toast.error('您没有管理员权限');
            setTimeout(() => window.__navigate('/'), 1500);
            return;
        }

        currentUser = data.user;
        updateUserInfo();
    } catch (err) {
        console.error('登录检查失败:', err);
        window.__navigate('/blog/pages/login.html');
    }
}

// 渲染头像（支持表情和图片）
function renderAvatar(avatar, size = 60) {
    if (!avatar) return '🧑‍💻';
    if (avatar.startsWith('data:image') || avatar.startsWith('/blog/data/avatars') || avatar.startsWith('/data/avatars')) {
        return `<img src="${avatar}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;">`;
    }
    return avatar;
}

// 更新用户信息显示
function updateUserInfo() {
    if (!currentUser) return;
    
    const name = currentUser.username;
    const avatar = currentUser.avatar;
    
    // 导航栏
    const userInfo = document.getElementById('userInfo');
    const logoutBtn = document.getElementById('logoutBtn');
    if (userInfo) userInfo.textContent = name;
    if (logoutBtn) logoutBtn.style.display = 'block';
    
    // 侧边栏
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    if (sidebarAvatar) {
        if (avatar && (avatar.startsWith('data:image') || avatar.startsWith('/blog/data/avatars') || avatar.startsWith('/data/avatars'))) {
            sidebarAvatar.innerHTML = renderAvatar(avatar, 60);
        } else {
            sidebarAvatar.textContent = avatar || '🧑‍💻';
        }
    }
    const sidebarName = document.getElementById('sidebarName');
    const sidebarRole = document.getElementById('sidebarRole');
    if (sidebarName) sidebarName.textContent = name;
    if (sidebarRole) sidebarRole.textContent = '管理员';
    
    // 管理侧边栏
    const adminAvatar = document.getElementById('adminAvatar');
    if (adminAvatar) {
        if (avatar && (avatar.startsWith('data:image') || avatar.startsWith('/blog/data/avatars') || avatar.startsWith('/data/avatars'))) {
            adminAvatar.innerHTML = renderAvatar(avatar, 60);
        } else {
            adminAvatar.textContent = avatar || '🧑‍💻';
        }
    }
    const adminName = document.getElementById('adminName');
    const adminRole = document.getElementById('adminRole');
    if (adminName) adminName.textContent = name;
    if (adminRole) adminRole.textContent = '管理员';
}

// 初始化文章筛选
function initPostFilter() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPostStatus = btn.dataset.status;
            loadPosts();
        });
    });
}

// 初始化导航
function initNavigation() {
    // 桌面端导航
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            switchSection(section);
        });
    });
    
    // 移动端导航
    document.querySelectorAll('#mobile-sidebar .sidebar-nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            if (section) {
                switchSection(section);
                // 关闭侧边栏
                document.getElementById('menu-toggle').classList.remove('active');
                document.getElementById('mobile-sidebar').classList.remove('active');
                document.getElementById('sidebar-overlay').classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
}

// 切换页面
function switchSection(section) {
    // 更新导航状态
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.section === section);
    });
    document.querySelectorAll('#mobile-sidebar .sidebar-nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.section === section);
    });
    
    // 显示对应区域
    document.querySelectorAll('.admin-section').forEach(sec => {
        sec.classList.toggle('active', sec.id === section + 'Section');
    });
    
    // 加载数据
    switch(section) {
        case 'posts':
            loadPosts();
            break;
        case 'comments':
            loadComments();
            break;
        case 'stats':
            loadStats();
            break;
    }
}

// 初始化退出登录
function initLogout() {
    const doLogout = async () => {
        const confirmed = await Toast.confirm({
            message: '退出登录后需要重新登录，确定要退出吗？',
            title: '退出登录',
            type: 'warning',
            confirmText: '退出',
            cancelText: '取消'
        });
        if (!confirmed) return;

        try {
            await fetch('/blog/api/auth.php?action=logout');
            Toast.success('已退出登录');
            if (window.WumingBlog && window.WumingBlog.clearAuthUI) {
                window.WumingBlog.clearAuthUI();
            }
            setTimeout(() => window.__navigate('/blog/pages/login.html'), 1000);
        } catch (err) {
            Toast.error('退出失败，请重试');
        }
    };
    
    document.getElementById('logoutBtn')?.addEventListener('click', doLogout);
    document.getElementById('sidebarLogout')?.addEventListener('click', doLogout);
}

// 初始化修改密码
function initChangePassword() {
    const changePwdBtn = document.getElementById('changePwdBtn');
    if (!changePwdBtn) return;
    
    changePwdBtn.addEventListener('click', async () => {
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (!oldPassword || !newPassword || !confirmPassword) {
            Toast.warning('请填写所有字段');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            Toast.warning('两次密码输入不一致');
            return;
        }
        
        if (newPassword.length < 6) {
            Toast.warning('密码至少6个字符');
            return;
        }
        
        try {
            const res = await fetch('/blog/api/auth.php?action=change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({
                    old_password: oldPassword,
                    new_password: newPassword
                })
            });
            
            const data = await res.json();
            
            if (data.success) {
                Toast.success('密码修改成功');
                document.getElementById('oldPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';
            } else {
                Toast.error(data.message || '修改失败');
            }
        } catch (err) {
            Toast.error('网络错误');
        }
    });
}

// 加载文章列表
let currentPostStatus = 'all';

async function loadPosts() {
    const container = document.getElementById('postsList');
    container.innerHTML = '<div class="loading">加载中...</div>';

    try {
        const url = currentPostStatus ? `/blog/api/posts.php?status=${currentPostStatus}` : '/blog/api/posts.php';
        const res = await fetch(url);
        const text = await res.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            container.innerHTML = `<div class="empty-state"><div class="icon">❌</div><h3>API返回非JSON</h3><p><pre>${text.substring(0, 500)}</pre></p></div>`;
            return;
        }
        
        // API 返回 data 字段，不是 posts
        const posts = data.data || [];
        
        if (!posts || posts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📝</div>
                    <h3>还没有文章</h3>
                    <p>点击"新建文章"开始创作吧！</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = posts.map(post => `
            <div class="post-item" data-id="${post.id}">
                <div class="post-item-info">
                    <div class="post-item-title">${escapeHtml(post.title)}</div>
                    <div class="post-item-meta">
                        <span>${post.created_at || ''}</span>
                        <span>👁️ ${post.views || 0}</span>
                        <span>💬 ${post.comments || 0}</span>
                        <span class="status-badge ${post.status || 'published'}">${post.status === 'draft' ? '草稿' : '已发布'}</span>
                    </div>
                </div>
                <div class="post-item-actions">
                    <button class="btn-secondary btn-small" onclick="editPost(${post.id})">编辑</button>
                    <button class="btn-danger btn-small" onclick="deletePost(${post.id})">删除</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = `<div class="empty-state"><div class="icon">❌</div><h3>加载失败</h3><p>${err.message}</p></div>`;
    }
}

// 加载评论列表
async function loadComments() {
    const container = document.getElementById('commentsList');
    container.innerHTML = '<div class="loading">加载中...</div>';
    
    try {
        const res = await fetch('/blog/api/comments.php?all=true');
        const data = await res.json();
        
        const comments = data.comments || [];
        
        if (comments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">💬</div>
                    <h3>还没有评论</h3>
                </div>
            `;
            return;
        }
        
        container.innerHTML = comments.map(comment => `
            <div class="comment-item" data-id="${comment.id}">
                <div class="comment-header">
                    <span class="comment-author">${escapeHtml(comment.user || '匿名')}</span>
                    <span class="comment-date">${comment.created_at || ''}</span>
                </div>
                <div class="comment-content">${escapeHtml(comment.content)}</div>
                <div class="comment-footer">
                    <span>文章: ${escapeHtml(comment.post_title || '未知')}</span>
                    <button class="btn-danger btn-small" onclick="deleteComment(${comment.id})">删除</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = '<div class="empty-state"><div class="icon">❌</div><h3>加载失败</h3></div>';
    }
}

// 加载统计信息
async function loadStats() {
    const container = document.getElementById('statsGrid');
    container.innerHTML = '<div class="loading">加载中...</div>';

    try {
        const res = await fetch('/blog/api/stats.php?all=true');
        const data = await res.json();
        
        // API 返回 stats 字段
        const stats = data.stats || {};
        
        container.innerHTML = `
            <div class="stat-card">
                <div class="value">${stats.posts || 0}</div>
                <div class="label">文章总数</div>
            </div>
            <div class="stat-card">
                <div class="value">${stats.views || 0}</div>
                <div class="label">总浏览量</div>
            </div>
            <div class="stat-card">
                <div class="value">${stats.comments || 0}</div>
                <div class="label">评论总数</div>
            </div>
            <div class="stat-card">
                <div class="value">${stats.categories || 0}</div>
                <div class="label">分类数</div>
            </div>
            <div class="stat-card">
                <div class="value">${stats.tags || 0}</div>
                <div class="label">标签数</div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = '<div class="empty-state"><div class="icon">❌</div><h3>加载失败</h3></div>';
    }
}

// 初始化文章编辑模态框
function initPostModal() {
    const modal = document.getElementById('postModal');
    const newBtn = document.getElementById('newPostBtn');
    const closeBtn = document.getElementById('modalClose');
    const cancelBtn = document.getElementById('modalCancel');
    const saveBtn = document.getElementById('modalSave');
    
    // 新建文章
    newBtn.addEventListener('click', () => {
        openModal();
    });
    
    // 关闭模态框
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    // 保存文章
    saveBtn.addEventListener('click', savePost);
}

// 打开模态框
function openModal(post = null) {
    const modal = document.getElementById('postModal');
    const title = document.getElementById('modalTitle');
    
    // 清空表单
    document.getElementById('postId').value = '';
    document.getElementById('postTitle').value = '';
    document.getElementById('postExcerpt').value = '';
    document.getElementById('postContent').value = '';
    document.getElementById('postStatus').value = 'published';
    
    if (post) {
        title.textContent = '编辑文章';
        document.getElementById('postId').value = post.id;
        document.getElementById('postTitle').value = post.title;
        document.getElementById('postExcerpt').value = post.excerpt || '';
        document.getElementById('postContent').value = post.content || '';
        document.getElementById('postStatus').value = post.status || 'published';
        
        // 渲染选中的分类
        const categoryId = post.category_id || (post.category ? post.category.id : null);
        renderCategoryOptions(categoryId);
        
        // 渲染选中的标签
        const tagIds = (post.tags || []).map(t => t.id || t);
        renderTagOptions(tagIds);
    } else {
        title.textContent = '新建文章';
        renderCategoryOptions(null);
        renderTagOptions([]);
    }
    
    modal.classList.add('active');
}

// 关闭模态框
function closeModal() {
    document.getElementById('postModal').classList.remove('active');
}

// 编辑文章
async function editPost(id) {
    try {
        const res = await fetch(`/blog/api/post.php?id=${id}&noView=1`);
        const post = await res.json();

        if (post.post) {
            openModal(post.post);
        }
    } catch (err) {
        Toast.error('加载文章失败');
    }
}

// 保存文章
async function savePost() {
    const id = document.getElementById('postId').value;
    const title = document.getElementById('postTitle').value.trim();
    const categoryId = getSelectedCategoryId();
    const tagIds = getSelectedTagIds();
    const excerpt = document.getElementById('postExcerpt').value.trim();
    const content = document.getElementById('postContent').value.trim();
    const status = document.getElementById('postStatus').value;
    
    if (!title) {
        Toast.warning('请输入文章标题');
        return;
    }
    
    try {
        const url = id ? `/blog/api/post.php?id=${id}` : '/blog/api/post.php';
        const method = id ? 'PUT' : 'POST';
        
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ 
                title, 
                category_id: categoryId, 
                tag_ids: tagIds, 
                excerpt, 
                content, 
                status 
            })
        });
        
        const data = await res.json();
        
        if (data.success) {
            closeModal();
            loadPosts();
            Toast.success('文章保存成功');
        } else {
            Toast.error(data.message || '保存失败');
        }
    } catch (err) {
        Toast.error('加载文章失败');
    }
}
window.editPost = editPost;

// 删除文章
async function deletePost(id) {
    const confirmed = await Toast.confirm({
        message: '此操作不可恢复，确定要删除这篇文章吗？',
        title: '删除文章',
        type: 'error',
        confirmText: '删除',
        cancelText: '取消'
    });
    if (!confirmed) return;
    
    try {
        const res = await fetch(`/blog/api/post.php?id=${id}`, {
            method: 'DELETE',
            credentials: 'same-origin'
        });
        
        const data = await res.json();
        
        if (data.success) {
            loadPosts();
            Toast.success('文章已删除');
        } else {
            Toast.error(data.message || '删除失败');
        }
    } catch (err) {
        Toast.error('网络错误');
    }
}
window.deletePost = deletePost;

// 删除评论
async function deleteComment(id) {
    const confirmed = await Toast.confirm({
        message: '确定要删除这条评论吗？',
        title: '删除评论',
        type: 'warning',
        confirmText: '删除',
        cancelText: '取消'
    });
    if (!confirmed) return;
    
    try {
        const res = await fetch(`/blog/api/comments.php?id=${id}`, {
            method: 'DELETE',
            credentials: 'same-origin'
        });
        
        const data = await res.json();
        
        if (data.success) {
            loadComments();
            Toast.success('评论已删除');
        } else {
            Toast.error(data.message || '删除失败');
        }
    } catch (err) {
        Toast.error('网络错误');
    }
}
window.deleteComment = deleteComment;

// HTML转义
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 加载分类和标签
async function loadCategoriesAndTags() {
    try {
        const [catRes, tagRes] = await Promise.all([
            fetch('/blog/api/categories.php'),
            fetch('/blog/api/tags.php')
        ]);
        
        const catData = await catRes.json();
        const tagData = await tagRes.json();
        
        allCategories = catData.categories || [];
        allTags = tagData.tags || [];
        
        renderCategoryOptions();
        renderTagOptions();
    } catch (err) {
        console.error('加载分类和标签失败:', err);
    }
}

// 渲染分类单选框
function renderCategoryOptions(selectedId = null) {
    const container = document.getElementById('categoryOptions');
    if (!container) return;
    
    if (allCategories.length === 0) {
        container.innerHTML = '<div class="empty-hint">暂无分类</div>';
        return;
    }
    
    container.innerHTML = allCategories.map(cat => `
        <label class="radio-item">
            <input type="radio" name="category" value="${cat.id}" ${selectedId == cat.id ? 'checked' : ''}>
            <span class="radio-label">${cat.icon || '📁'} ${escapeHtml(cat.name)}</span>
        </label>
    `).join('');
}

// 渲染标签多选框
function renderTagOptions(selectedIds = []) {
    const container = document.getElementById('tagOptions');
    if (!container) return;
    
    if (allTags.length === 0) {
        container.innerHTML = '<div class="empty-hint">暂无标签</div>';
        return;
    }
    
    container.innerHTML = allTags.map(tag => `
        <label class="checkbox-item">
            <input type="checkbox" name="tags" value="${tag.id}" ${selectedIds.includes(tag.id) ? 'checked' : ''}>
            <span class="checkbox-label" style="border-color: ${tag.color || '#4dabf7'}">${escapeHtml(tag.name)}</span>
        </label>
    `).join('');
}

// 获取选中的分类ID
function getSelectedCategoryId() {
    const checked = document.querySelector('input[name="category"]:checked');
    return checked ? parseInt(checked.value) : null;
}

// 获取选中的标签ID数组
function getSelectedTagIds() {
    const checked = document.querySelectorAll('input[name="tags"]:checked');
    return Array.from(checked).map(el => parseInt(el.value));
}