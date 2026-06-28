/**
 * Wuming Blog - 文章列表页面脚本（带多标签筛选和排序）
 */

let allTags = [];
let allCategories = [];
let selectedTags = []; // 多选标签
let selectedCategory = ''; // 单选分类
let currentSort = 'created_at';
let currentOrder = 'DESC';

async function initArchivePage() {
    try {
        // 先检查URL参数
        const urlParams = new URLSearchParams(window.location.search);
        const tagParam = urlParams.get('tag');
        const categoryParam = urlParams.get('category');
        const hasUrlFilter = tagParam || categoryParam;

        // 同时加载标签、分类和文章
        const [tagsRes, categoriesRes, postsRes] = await Promise.all([
            WumingBlog.fetchAPI('/tags.php'),
            WumingBlog.fetchAPI('/categories.php'),
            WumingBlog.fetchAPI('/posts.php?limit=100')
        ]);

        // 渲染标签筛选器
        if (tagsRes && tagsRes.success && tagsRes.tags) {
            allTags = tagsRes.tags;
            renderTagFilter(allTags);
        }

        // 渲染分类筛选器
        if (categoriesRes && categoriesRes.success && categoriesRes.categories) {
            allCategories = categoriesRes.categories;
            renderCategoryFilter(allCategories);
        }

        if (!postsRes || !postsRes.success) {
            WumingBlog.showError('archive-timeline');
            return;
        }

        // 如果没有URL筛选参数，渲染全部文章
        if (!hasUrlFilter) {
            renderArchive(postsRes.data);
            updateTotalCount(postsRes.data.length);
        }

        // 设置URL筛选条件的UI状态
        if (tagParam) {
            selectedTags = [tagParam];
            document.querySelectorAll('#filter-tags .filter-tag').forEach(b => b.classList.remove('active'));
            const tagBtn = document.querySelector(`#filter-tags .filter-tag[data-tag="${tagParam}"]`);
            if (tagBtn) tagBtn.classList.add('active');
        }

        if (categoryParam) {
            selectedCategory = categoryParam;
            document.querySelectorAll('#filter-categories .filter-tag').forEach(b => b.classList.remove('active'));
            const catBtn = document.querySelector(`#filter-categories .filter-tag[data-category="${categoryParam}"]`);
            if (catBtn) catBtn.classList.add('active');
        }

        // 有URL筛选参数时，直接带参数请求
        if (hasUrlFilter) {
            applyFilters();
        }

    } catch (error) {
        WumingBlog.showError('archive-timeline');
    }
}

function renderTagFilter(tags) {
    const container = document.getElementById('filter-tags');
    if (!container) return;

    let html = '<button class="filter-tag active" data-tag="">全部</button>';
    html += tags.map(tag => 
        `<button class="filter-tag" data-tag="${tag.slug}" style="--tag-color: ${tag.color || '#4dabf7'}">${tag.name}</button>`
    ).join('');

    container.innerHTML = html;

    // 绑定点击事件（多选逻辑）
    container.querySelectorAll('.filter-tag').forEach(btn => {
        btn.addEventListener('click', () => {
            const tagSlug = btn.dataset.tag;
            
            if (tagSlug === '') {
                // 点击"全部"，清除所有选中
                selectedTags = [];
                container.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            } else {
                // 切换选中状态
                btn.classList.toggle('active');
                
                // 移除"全部"的选中状态
                container.querySelector('.filter-tag[data-tag=""]').classList.remove('active');
                
                // 更新选中列表
                if (btn.classList.contains('active')) {
                    if (!selectedTags.includes(tagSlug)) {
                        selectedTags.push(tagSlug);
                    }
                } else {
                    selectedTags = selectedTags.filter(t => t !== tagSlug);
                }
                
                // 如果没有选中任何标签，自动选中"全部"
                if (selectedTags.length === 0) {
                    container.querySelector('.filter-tag[data-tag=""]').classList.add('active');
                }
            }
            
            applyFilters();
        });
    });

    // 绑定排序按钮事件
    document.querySelectorAll('#sort-options .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const sort = btn.dataset.sort;
            
            // 如果点击当前排序，切换排序方向
            if (currentSort === sort) {
                currentOrder = currentOrder === 'DESC' ? 'ASC' : 'DESC';
            } else {
                currentSort = sort;
                currentOrder = 'DESC';
            }
            
            // 更新UI
            document.querySelectorAll('#sort-options .filter-btn').forEach(b => {
                b.classList.remove('active');
                const arrow = b.querySelector('.sort-arrow');
                if (b.dataset.sort === currentSort) {
                    b.classList.add('active');
                    arrow.textContent = currentOrder === 'DESC' ? '↓' : '↑';
                } else {
                    arrow.textContent = '↓';
                }
            });
            
            applyFilters();
        });
    });

    // 绑定清除筛选按钮
    document.getElementById('clear-filter')?.addEventListener('click', () => {
        // 重置标签
        selectedTags = [];
        document.querySelectorAll('#filter-tags .filter-tag').forEach(b => b.classList.remove('active'));
        document.querySelector('#filter-tags .filter-tag[data-tag=""]')?.classList.add('active');

        // 重置分类
        selectedCategory = '';
        document.querySelectorAll('#filter-categories .filter-tag').forEach(b => b.classList.remove('active'));
        document.querySelector('#filter-categories .filter-tag[data-category=""]')?.classList.add('active');

        // 重置排序
        currentSort = 'created_at';
        currentOrder = 'DESC';
        document.querySelectorAll('#sort-options .filter-btn').forEach(b => {
            b.classList.remove('active');
            b.querySelector('.sort-arrow').textContent = '↓';
        });
        document.querySelector('#sort-options .filter-btn[data-sort="created_at"]')?.classList.add('active');

        applyFilters();
    });
}

// 渲染分类筛选器
function renderCategoryFilter(categories) {
    const container = document.getElementById('filter-categories');
    if (!container) return;

    let html = '<button class="filter-tag active" data-category="">全部</button>';
    html += categories.map(cat =>
        `<button class="filter-tag" data-category="${cat.slug}">${cat.icon || '📁'} ${cat.name}</button>`
    ).join('');

    container.innerHTML = html;

    // 绑定点击事件（单选逻辑）
    container.querySelectorAll('.filter-tag').forEach(btn => {
        btn.addEventListener('click', () => {
            // 移除所有选中
            container.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            selectedCategory = btn.dataset.category || '';
            applyFilters();
        });
    });
}

async function applyFilters() {
    const container = document.getElementById('archive-timeline');
    container.innerHTML = '<div class="loading">加载中...</div>';

    try {
        let url = `/posts.php?limit=100&sort=${currentSort}&order=${currentOrder}`;

        // 多标签筛选
        if (selectedTags.length > 0) {
            url += `&tag_slugs=${encodeURIComponent(selectedTags.join(','))}`;
        }

        // 分类筛选
        if (selectedCategory) {
            url += `&category_slug=${encodeURIComponent(selectedCategory)}`;
        }

        const response = await WumingBlog.fetchAPI(url);
        
        if (!response || !response.success) {
            WumingBlog.showError('archive-timeline');
            return;
        }

        renderArchive(response.data);
        updateTotalCount(response.data.length);
        updateFilterStatus();
    } catch (error) {
        WumingBlog.showError('archive-timeline');
    }
}

function updateFilterStatus() {
    const statusEl = document.getElementById('filter-status');
    const textEl = statusEl?.querySelector('.status-text');
    const clearBtn = document.getElementById('clear-filter');

    if (!statusEl || !textEl) return;

    const hasTags = selectedTags.length > 0;
    const hasCategory = selectedCategory !== '';
    const hasSort = currentSort !== 'created_at';
    const hasFilters = hasTags || hasCategory || hasSort;

    let statusText = '显示全部文章';

    if (hasTags || hasCategory || hasSort) {
        const parts = [];

        if (hasCategory) {
            const cat = allCategories.find(c => c.slug === selectedCategory);
            parts.push(`分类: ${cat ? cat.name : selectedCategory}`);
        }

        if (hasTags) {
            const tagNames = selectedTags.map(slug => {
                const tag = allTags.find(t => t.slug === slug);
                return tag ? tag.name : slug;
            });
            parts.push(`标签: ${tagNames.join('、')}`);
        }

        if (hasSort) {
            const sortNames = {
                'created_at': '发布时间',
                'views': '浏览量',
                'comments': '评论数'
            };
            const orderName = currentOrder === 'DESC' ? '降序' : '升序';
            parts.push(`${sortNames[currentSort]} ${orderName}`);
        }

        statusText = parts.join(' | ');
    }

    textEl.textContent = statusText;

    if (clearBtn) {
        clearBtn.style.display = hasFilters ? 'inline-block' : 'none';
    }
}

function updateTotalCount(count) {
    const totalEl = document.getElementById('total-posts');
    if (totalEl) {
        totalEl.textContent = count;
    }
}

function renderArchive(posts) {
    const container = document.getElementById('archive-timeline');
    if (!container) return;

    if (!posts || posts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📝</div>
                <h3>暂无文章</h3>
                <p>没有符合条件的文章</p>
            </div>
        `;
        return;
    }

    // 如果按热度或评论排序，不按时间分组，直接显示列表
    if (currentSort !== 'created_at') {
        let html = '';
        posts.forEach(post => {
            const tags = post.tags || [];
            const views = post.views || 0;
            const comments = post.comments || 0;
            
            html += `
                <div class="archive-item">
                    <div class="archive-item-main">
                        <a href="/blog_ref/pages/post.html?id=${post.id}" class="archive-item-title">${post.title || '无标题'}</a>
                        <div class="archive-item-meta">
                            <span class="meta-date">📅 ${WumingBlog.formatDate(post.created_at)}</span>
                            <span class="meta-views">👁️ ${views}</span>
                            <span class="meta-comments">💬 ${comments}</span>
                            <a href="/blog_ref/pages/post3d.html?id=${post.id}" class="meta-3d-link" title="3D 沉浸阅读">🚀 3D</a>
                        </div>
                    </div>
                    <div class="archive-item-tags">
                        ${tags.slice(0, 3).map(tag => {
                            const isActive = selectedTags.includes(tag.slug);
                            return `<span class="tag ${isActive ? 'active' : ''}" style="--tag-color: ${tag.color || '#4dabf7'}">${tag.name || tag}</span>`;
                        }).join('')}
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
        return;
    }

    // 按时间分组显示
    const archive = {};
    posts.forEach(post => {
        const date = new Date(post.created_at);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        if (!archive[year]) archive[year] = {};
        if (!archive[year][month]) archive[year][month] = [];
        archive[year][month].push(post);
    });

    let html = '';
    Object.keys(archive)
        .sort((a, b) => b - a)
        .forEach(year => {
            html += `<div class="year-group"><h2 class="year-title">${year} 年</h2>`;

            Object.keys(archive[year])
                .sort((a, b) => b - a)
                .forEach(month => {
                    html += `<div class="month-group"><h3 class="month-title">${month} 月</h3>`;

                    archive[year][month].forEach(post => {
                        const tags = post.tags || [];
                        const views = post.views || 0;
                        const comments = post.comments || 0;
                        
                        html += `
                            <div class="archive-item">
                                <div class="archive-item-main">
                                    <a href="/blog_ref/pages/post.html?id=${post.id}" class="archive-item-title">${post.title || '无标题'}</a>
                                    <div class="archive-item-meta">
                                        <span class="meta-date">📅 ${WumingBlog.formatDate(post.created_at)}</span>
                                        <span class="meta-views">👁️ ${views}</span>
                                        <span class="meta-comments">💬 ${comments}</span>
                                        <a href="/blog_ref/pages/post3d.html?id=${post.id}" class="meta-3d-link" title="3D 沉浸阅读">🚀 3D</a>
                                    </div>
                                </div>
                                <div class="archive-item-tags">
                                    ${tags.slice(0, 3).map(tag => {
                                        const isActive = selectedTags.includes(tag.slug);
                                        return `<span class="tag ${isActive ? 'active' : ''}" style="--tag-color: ${tag.color || '#4dabf7'}">${tag.name || tag}</span>`;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                    });

                    html += '</div>';
                });

            html += '</div>';
        });

    container.innerHTML = html;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initArchivePage);
} else {
    initArchivePage();
}