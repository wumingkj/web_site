/**
 * Wuming Blog - 分类页面脚本
 */

async function initCategoriesPage() {
    try {
        const response = await WumingBlog.fetchAPI('/categories.php');

        if (!response || !response.success || !response.categories) {
            WumingBlog.showError('categories-grid');
            return;
        }

        renderCategories(response.categories);
    } catch (error) {
        WumingBlog.showError('categories-grid');
    }
}

function renderCategories(categories) {
    const container = document.getElementById('categories-grid');
    if (!container) return;

    const icons = ['💻', '🎨', '⚙️', '📝', '🌈', '🔧', '📱', '🚀'];

    const html = categories.map((cat, index) => `
        <a href="/blog_ref/pages/archive.html?category=${cat.slug || ''}" class="category-card">
            <div class="category-icon">${cat.icon || icons[index % icons.length]}</div>
            <h2 class="category-name">${cat.name || '未分类'}</h2>
            <p class="category-desc">${cat.description || '暂无描述'}</p>
            <span class="category-count">${cat.post_count || 0} 篇文章</span>
        </a>
    `).join('');

    container.innerHTML = html;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCategoriesPage);
} else {
    initCategoriesPage();
}