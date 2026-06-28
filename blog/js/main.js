/**
 * Wuming Blog - 首页脚本
 */

async function initHomePage() {
    try {
        const [posts, categories, tags, stats] = await Promise.all([
            WumingBlog.fetchAPI('/posts.php?limit=5'),
            WumingBlog.fetchAPI('/categories.php'),
            WumingBlog.fetchAPI('/tags.php'),
            WumingBlog.fetchAPI('/stats.php')
        ]);

        if (posts && posts.success && posts.data) {
            renderPosts(posts.data);
        } else {
            WumingBlog.showError('posts-container');
        }

        if (categories && categories.success && Array.isArray(categories.categories)) {
            renderCategories(categories.categories);
        }

        if (tags && tags.success && Array.isArray(tags.tags)) {
            renderTags(tags.tags);
        }

        if (stats && stats.success && stats.stats) {
            updateStats(stats.stats);
        }
    } catch (error) {
        console.error('Init error:', error);
        WumingBlog.showError('posts-container');
    }
}

function renderPosts(posts) {
    const container = document.getElementById('posts-container');
    if (!container) return;

    const html = posts.map((post, index) => `
        <article class="post-card fade-in" style="animation-delay: ${index * 0.1}s">
            <div class="post-header">
                <a href="/blog/pages/post.html?id=${post.id}" class="post-title">${post.title}</a>
            </div>
            <div class="post-meta">
                <span>📅 ${WumingBlog.formatDate(post.created_at)}</span>
                <span>👁️ ${post.views}</span>
                <span>💬 ${post.comments || 0}</span>
            </div>
            <p class="post-excerpt">${post.excerpt || ''}</p>
            <div class="post-tags">
                ${(post.tags || []).map(tag => `<span class="tag">${tag.name || tag}</span>`).join('')}
            </div>
        </article>
    `).join('');

    container.innerHTML = html;
}

function renderCategories(categories) {
    const container = document.getElementById('categories-container');
    if (!container) return;

    const html = categories.map(cat => `
        <a href="/blog/pages/archive.html?category=${cat.slug}" class="category-item">
            <span>${cat.name}</span>
            <span class="category-count">${cat.post_count || 0}</span>
        </a>
    `).join('');

    container.innerHTML = html;
}

function renderTags(tags) {
    const container = document.getElementById('tags-container');
    if (!container) return;

    const html = tags.map(tag => 
        `<a href="/blog/pages/archive.html?tag=${tag.slug}" class="cloud-tag" style="--tag-color: ${tag.color || '#4dabf7'}">${tag.name}<small>${tag.post_count || 0}</small></a>`
    ).join('');

    container.innerHTML = html;
}

function updateStats(stats) {
    const elements = {
        'stat-posts': stats.posts,
        'stat-categories': stats.categories,
        'stat-comments': stats.comments,
        'stat-views': stats.views
    };

    for (const [id, value] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el && value !== undefined) {
            WumingBlog.animateNumber(el, parseInt(value));
        }
    }
}

document.addEventListener('DOMContentLoaded', initHomePage);