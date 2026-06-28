/**
 * Wuming Blog - Toast 消息系统
 */

const Toast = {
    container: null,
    items: [],
    maxItems: 5,
    defaultDuration: 3000,

    /**
     * 初始化 Toast 容器
     */
    init() {
        if (this.container) return;
        
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        this.container.id = 'toast-container';
        document.body.appendChild(this.container);
    },

    /**
     * 显示 Toast
     * @param {Object} options - 配置项
     * @param {string} options.message - 消息内容
     * @param {string} options.title - 标题（可选）
     * @param {string} options.type - 类型：success/error/warning/info/default
     * @param {number} options.duration - 持续时间（毫秒），0 表示不自动关闭
     */
    show(options) {
        this.init();

        const {
            message,
            title = '',
            type = 'default',
            duration = this.defaultDuration
        } = options;

        const item = document.createElement('div');
        item.className = `toast-item ${type}`;
        
        const iconMap = {
            success: '✓',
            error: '✕',
            warning: '!',
            info: 'i',
            default: '✨'
        };

        item.innerHTML = `
            <div class="toast-icon">${iconMap[type] || iconMap.default}</div>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" aria-label="关闭">×</button>
            ${duration > 0 ? '<div class="toast-progress"></div>' : ''}
        `;

        // 添加到容器顶部（新消息在上）
        this.container.insertBefore(item, this.container.firstChild);
        this.items.unshift(item);

        // 限制最大数量
        while (this.items.length > this.maxItems) {
            const lastItem = this.items.pop();
            if (lastItem) {
                lastItem.classList.add('hide');
                setTimeout(() => lastItem.remove(), 400);
            }
        }

        // 显示动画
        requestAnimationFrame(() => {
            item.classList.add('show');
        });

        // 进度条动画
        if (duration > 0) {
            const progress = item.querySelector('.toast-progress');
            if (progress) {
                progress.style.width = '100%';
                progress.style.transition = `width ${duration}ms linear`;
                requestAnimationFrame(() => {
                    progress.style.width = '0%';
                });
            }
        }

        // 关闭按钮
        const closeBtn = item.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.hide(item));

        // 自动关闭
        if (duration > 0) {
            setTimeout(() => this.hide(item), duration);
        }

        return item;
    },

    /**
     * 隐藏 Toast
     */
    hide(item) {
        if (!item || !item.parentNode) return;
        
        item.classList.remove('show');
        item.classList.add('hide');
        
        setTimeout(() => {
            if (item.parentNode) {
                item.remove();
            }
            const index = this.items.indexOf(item);
            if (index > -1) {
                this.items.splice(index, 1);
            }
        }, 400);
    },

    /**
     * 清除所有 Toast
     */
    clearAll() {
        this.items.forEach(item => this.hide(item));
    },

    // 快捷方法
    success(message, title = '') {
        return this.show({ message, title, type: 'success' });
    },

    error(message, title = '') {
        return this.show({ message, title, type: 'error', duration: 5000 });
    },

    warning(message, title = '') {
        return this.show({ message, title, type: 'warning', duration: 4000 });
    },

    info(message, title = '') {
        return this.show({ message, title, type: 'info' });
    },

    /**
     * 歌词 Toast（特殊类型，显示当前歌词 + 下一句预览）
     * @param {string} current - 当前歌词
     * @param {string} next - 下一句歌词
     * @param {number} duration - 持续时间（毫秒）
     */
    lrc(current, next, duration) {
        this.init();

        // 歌词 toast 使用独立容器（左侧弹出）
        if (!this.lrcContainer) {
            this.lrcContainer = document.createElement('div');
            this.lrcContainer.className = 'toast-lrc-container';
            this.lrcContainer.id = 'toast-lrc-container';
            document.body.appendChild(this.lrcContainer);
        }

        duration = duration || this.defaultDuration;
        var messageHTML =
            '<span class="toast-lrc-current">' + (current || '♪') + '</span>' +
            (next ? '<span class="toast-lrc-next">' + next + '</span>' : '');

        var item = document.createElement('div');
        item.className = 'toast-item lrc';

        item.innerHTML =
            '<div class="toast-content">' +
                '<div class="toast-message">' + messageHTML + '</div>' +
            '</div>' +
            (duration > 0 ? '<div class="toast-progress"></div>' : '');

        this.lrcContainer.insertBefore(item, this.lrcContainer.firstChild);

        requestAnimationFrame(function () {
            item.classList.add('show');
        });

        if (duration > 0) {
            var progress = item.querySelector('.toast-progress');
            if (progress) {
                progress.style.width = '100%';
                progress.style.transition = 'width ' + duration + 'ms linear';
                requestAnimationFrame(function () {
                    progress.style.width = '0%';
                });
            }
        }

        if (duration > 0) {
            var self = this;
            setTimeout(function () { self.hideLrc(item); }, duration);
        }

        return item;
    },

    /**
     * 隐藏歌词 Toast
     */
    hideLrc(item) {
        if (!item || !item.parentNode) return;
        item.classList.remove('show');
        item.classList.add('hide');
        setTimeout(function () {
            if (item.parentNode) item.remove();
        }, 400);
    },

    /**
     * 确认对话框（替代原生 confirm）
     * @param {Object} options - 配置项
     * @returns {Promise<boolean>}
     */
    confirm(options) {
        return new Promise((resolve) => {
            this.init();

            const {
                message,
                title = '确认操作',
                confirmText = '确定',
                cancelText = '取消',
                type = 'warning'
            } = typeof options === 'string' ? { message: options } : options;

            // 创建遮罩
            const overlay = document.createElement('div');
            overlay.className = 'toast-confirm-overlay';

            // 创建对话框
            const dialog = document.createElement('div');
            dialog.className = `toast-confirm-dialog ${type}`;

            const iconMap = {
                warning: '⚠️',
                error: '❌',
                info: 'ℹ️',
                success: '✅',
                default: '❓'
            };

            dialog.innerHTML = `
                <div class="confirm-icon">${iconMap[type] || iconMap.default}</div>
                <div class="confirm-title">${title}</div>
                <div class="confirm-message">${message}</div>
                <div class="confirm-buttons">
                    <button class="confirm-btn cancel">${cancelText}</button>
                    <button class="confirm-btn ok">${confirmText}</button>
                </div>
            `;

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            // 动画显示
            requestAnimationFrame(() => {
                overlay.classList.add('show');
                dialog.classList.add('show');
            });

            // 关闭函数
            const close = (result) => {
                overlay.classList.remove('show');
                dialog.classList.remove('show');
                setTimeout(() => {
                    overlay.remove();
                }, 300);
                resolve(result);
            };

            // 绑定事件
            dialog.querySelector('.confirm-btn.ok').addEventListener('click', () => close(true));
            dialog.querySelector('.confirm-btn.cancel').addEventListener('click', () => close(false));
            
            // 点击遮罩关闭
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) close(false);
            });

            // ESC 关闭
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    close(false);
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            document.addEventListener('keydown', handleEsc);
        });
    }
};

/**
 * 顶部公告栏管理
 */
const AnnouncementBar = {
    bar: null,
    storageKey: 'announcement_closed',

    /**
     * 显示顶部公告
     * @param {Object} options
     * @param {string} options.message - 公告内容
     * @param {string} options.type - 类型：success/warning/error/info/rainbow
     * @param {string} options.icon - 图标
     * @param {number} options.id - 公告ID（用于记住关闭状态）
     * @param {boolean} options.closable - 是否可关闭
     * @param {number} options.duration - 自动消失时间（秒），0表示不自动消失
     */
    show(options) {
        const {
            message,
            type = 'info',
            icon = '📢',
            id = null,
            closable = true,
            duration = 0
        } = options;

        // 检查是否已关闭
        if (id) {
            const closed = localStorage.getItem(`${this.storageKey}_${id}`);
            if (closed) return;
        }

        // 移除旧的
        this.hide();

        // 解析 Markdown
        const parsedMessage = typeof WumingBlog !== 'undefined' && WumingBlog.parseMarkdown 
            ? WumingBlog.parseMarkdown(message) 
            : message;

        this.bar = document.createElement('div');
        this.bar.className = `announcement-bar ${type}`;
        this.bar.innerHTML = `
            <span class="announcement-icon">${icon}</span>
            <div class="announcement-content">${parsedMessage}</div>
            ${closable ? '<button class="announcement-close" aria-label="关闭">×</button>' : ''}
        `;

        document.body.appendChild(this.bar);
        document.body.classList.add('has-announcement');

        // 显示动画
        requestAnimationFrame(() => {
            this.bar.classList.add('show');
        });

        // 关闭按钮
        if (closable) {
            const closeBtn = this.bar.querySelector('.announcement-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    if (id) {
                        localStorage.setItem(`${this.storageKey}_${id}`, '1');
                    }
                    this.hide();
                });
            }
        }

        // 自动消失
        if (duration > 0) {
            setTimeout(() => {
                this.hide();
            }, duration * 1000);
        }

        return this.bar;
    },

    /**
     * 隐藏公告
     */
    hide() {
        if (this.bar) {
            this.bar.classList.remove('show');
            setTimeout(() => {
                if (this.bar && this.bar.parentNode) {
                    this.bar.remove();
                }
                this.bar = null;
            }, 400);
        }
        document.body.classList.remove('has-announcement');
    },

    /**
     * 从 API 加载公告
     */
    async load() {
        try {
            const res = await fetch('/blog_ref/api/announcement.php');
            const data = await res.json();
            
            if (data.success && data.announcements) {
                // 缓存数据供其他模块复用
                this._cachedData = data;
                
                // 显示顶部公告（取第一个重要的）
                const topAnnouncement = data.announcements.find(a => a.position === 'top' && a.active);
                if (topAnnouncement) {
                    this.show({
                        message: topAnnouncement.content,
                        type: topAnnouncement.type || 'info',
                        icon: topAnnouncement.icon || '📢',
                        id: `top_${topAnnouncement.id}`,
                        closable: topAnnouncement.closable !== false,
                        duration: topAnnouncement.duration || 0
                    });
                }

                // 渲染侧边公告
                const sideAnnouncements = data.announcements.filter(a => a.position === 'side' && a.active);
                this.renderSidebar(sideAnnouncements);
            }
        } catch (err) {
            console.log('加载公告失败:', err);
        }
    },

    /**
     * 渲染侧边栏公告
     */
    renderSidebar(announcements) {
        const container = document.getElementById('announcement-sidebar-list');
        if (!container) return;

        if (!announcements || announcements.length === 0) {
            container.innerHTML = '<div class="announcement-sidebar-empty">暂无公告</div>';
            return;
        }

        container.innerHTML = announcements.map(a => `
            <div class="announcement-sidebar-item ${a.type || 'normal'}" data-id="${a.id}">
                <div class="item-icon">${a.icon || '📢'}</div>
                <div class="item-content">
                    <div class="item-title">${a.title || ''}</div>
                    <div class="item-meta">${a.created_at || ''}</div>
                </div>
                ${a.is_new ? '<span class="item-new">NEW</span>' : ''}
            </div>
        `).join('');

        // 点击查看详情
        container.querySelectorAll('.announcement-sidebar-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                const announcement = announcements.find(a => a.id == id);
                if (announcement) {
                    const parsedContent = typeof WumingBlog !== 'undefined' && WumingBlog.parseMarkdown 
                        ? WumingBlog.parseMarkdown(announcement.content) 
                        : announcement.content;
                    Toast.show({
                        message: parsedContent,
                        title: announcement.title,
                        type: announcement.type === 'important' ? 'warning' : 'info',
                        duration: (announcement.duration || 10) * 1000
                    });
                }
            });
        });
    }
};

// 初始化 - 公告加载由 common.js 统一处理