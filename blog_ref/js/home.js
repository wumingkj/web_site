/**
 * Wuming Blog - 首页脚本
 */

async function initHomePage() {
    try {
        const data = await WumingBlog.fetchAPI('/init.php');

        if (data && data.success) {
            if (data.tags) renderTags(data.tags);

            if (data.categories) renderCategories(data.categories);

            if (data.stats) {
                updateStats(data.stats);
                updateMobileStats(data.stats);
            }

            if (data.announcements) {
                renderAnnouncements(data.announcements);
            }
        } else {
            console.warn('Home: API 返回异常', data);
        }
    } catch (error) {
        console.error('Home: 初始化失败', error);
    }
}

function renderTags(tags) {
    const container = document.getElementById('tags-container');
    if (!container) return;

    const html = tags.map(tag => 
        `<a href="/blog_ref/pages/archive.html?tag=${encodeURIComponent(tag.slug)}" class="cloud-tag" style="--tag-color: ${tag.color || '#4dabf7'}">${tag.name}<small>${tag.post_count || 0}</small></a>`
    ).join('');

    container.innerHTML = html;
}

function renderCategories(categories) {
    const container = document.getElementById('categories-container');
    if (!container) return;

    const defaultIcons = ['💻', '🎨', '⚙️', '📝', '🌈', '🔧', '📱', '🚀'];

    const html = categories.map((cat, i) => 
        `<a href="/blog_ref/pages/archive.html?category=${encodeURIComponent(cat.slug)}" class="cloud-tag" style="--tag-color: ${['#ff6b6b','#ffa94d','#69db7c','#4dabf7','#9775fa','#e599f7','#ffd43b','#38d9a9'][i % 8]}">${cat.icon || defaultIcons[i % 8]} ${cat.name}<small>${cat.post_count || 0}</small></a>`
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

function renderAnnouncements(announcements) {
    const container = document.getElementById('announcement-list');
    if (!container) return;

    if (!announcements || announcements.length === 0) {
        container.innerHTML = '<div class="announcement-empty">暂无公告 📭</div>';
        return;
    }

    const html = announcements.slice(0, 4).map(a => `
        <div class="announcement-item ${a.type || 'info'}" data-id="${a.id}">
            <div class="item-icon">${a.icon || '📢'}</div>
            <div class="item-content">
                ${a.title ? `<div class="item-title">${a.title}</div>` : ''}
                <div class="item-text">${WumingBlog.parseMarkdown(a.content)}</div>
                ${a.created_at ? `<div class="item-date">${a.created_at}</div>` : ''}
            </div>
        </div>
    `).join('');

    container.innerHTML = html;

    // 点击查看详情
    container.querySelectorAll('.announcement-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.id;
            const announcement = announcements.find(a => a.id == id);
            if (announcement) {
                Toast.show({
                    message: WumingBlog.parseMarkdown(announcement.content),
                    title: announcement.title || '公告详情',
                    type: announcement.type === 'important' ? 'warning' : 'info',
                    duration: (announcement.duration || 10) * 1000
                });
            }
        });
    });
}

function updateMobileStats(stats) {
    const elements = {
        'mobile-stat-posts': stats.posts,
        'mobile-stat-views': stats.views,
        'mobile-stat-comments': stats.comments
    };

    for (const [id, value] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el && value !== undefined) {
            el.textContent = parseInt(value);
        }
    }
}

// 首页加载：直接初始化 + 监听 page:loaded 事件（SPA 导航回来时重新初始化）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomePage);
} else {
    initHomePage();
}

document.addEventListener('page:loaded', function (e) {
    var href = e.detail && e.detail.href;
    if (href === '/blog_ref/' || href === '/blog_ref/index.html') {
        initHomePage();
    }
});